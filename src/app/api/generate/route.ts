import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOpenAIClient } from '@/lib/openai/client';
import { generateText } from '@/lib/openai/text-generation';
import { generateImage } from '@/lib/openai/image-generation';
import { analyzeImage } from '@/lib/openai/vision';
import { generateSpeech } from '@/lib/openai/speech';
import { transcribeAudio } from '@/lib/openai/transcription';
import { searchWeb } from '@/lib/openai/web-search';
import {
  materializePrompt,
  renderInstruction,
  type Example,
} from '@/lib/utils/prompt-template';
import { upsertCellValue, getRowCells } from '@/lib/supabase/queries/cells';
import { upsertCellMeta } from '@/lib/supabase/queries/cell-meta';
import type { TaskType } from '@/lib/types/domain';
import { MAX_CONCURRENCY } from '@/lib/types/domain';

export const maxDuration = 300;

interface GenerateRequest {
  dataset_id: string;
  column_id: string;
  column_name: string;
  process: {
    prompt: string;
    model: string;
    task: TaskType;
    search_enabled: boolean;
    image_column_id?: string;
    columns_references?: string[];
  };
  offset: number;
  limit: number;
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-openai-api-key');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing OpenAI API key' }),
      { status: 401 },
    );
  }

  const body: GenerateRequest = await request.json();
  const {
    dataset_id,
    column_id,
    process: proc,
    offset,
    limit,
  } = body;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 },
    );
  }

  const openai = createOpenAIClient(apiKey);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`),
        );
      };

      try {
        const existingExamples: Example[] = [];

        // Process cells in batches of MAX_CONCURRENCY
        for (let i = offset; i < offset + limit; i += MAX_CONCURRENCY) {
          const batchEnd = Math.min(i + MAX_CONCURRENCY, offset + limit);
          const batchPromises: Promise<void>[] = [];

          for (let rowIdx = i; rowIdx < batchEnd; rowIdx++) {
            batchPromises.push(
              (async () => {
                // Mark cell as generating
                send('cell.generating', { row_idx: rowIdx, column_id });
                await upsertCellMeta(supabase, {
                  column_id,
                  row_idx: rowIdx,
                  generating: true,
                });

                let result: { value?: any; error?: string; sources?: any[] };

                try {
                  result = await generateSingleCell({
                    openai,
                    supabase,
                    proc,
                    dataset_id,
                    column_id,
                    rowIdx,
                    existingExamples,
                  });
                } catch (err) {
                  result = {
                    error:
                      err instanceof Error ? err.message : String(err),
                  };
                }

                // Save the result
                if (result.value !== undefined) {
                  await upsertCellValue(supabase, {
                    dataset_id,
                    column_id,
                    row_idx: rowIdx,
                    value: result.value,
                  });
                }

                await upsertCellMeta(supabase, {
                  column_id,
                  row_idx: rowIdx,
                  generating: false,
                  error: result.error || null,
                  sources: result.sources || null,
                });

                // Add to examples for deduplication
                if (result.value && !result.error) {
                  existingExamples.push({
                    output: String(result.value),
                    inputs: {},
                    validated: false,
                  });
                }

                send('cell.complete', {
                  row_idx: rowIdx,
                  column_id,
                  value: result.value,
                  error: result.error,
                  sources: result.sources,
                });
              })(),
            );
          }

          // Wait for batch to complete
          await Promise.all(batchPromises);
        }

        send('generation.complete', { column_id });
        controller.close();
      } catch (err) {
        send('generation.error', {
          error: err instanceof Error ? err.message : String(err),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

async function generateSingleCell({
  openai,
  supabase,
  proc,
  dataset_id,
  column_id,
  rowIdx,
  existingExamples,
}: {
  openai: any;
  supabase: any;
  proc: GenerateRequest['process'];
  dataset_id: string;
  column_id: string;
  rowIdx: number;
  existingExamples: Example[];
}): Promise<{ value?: any; error?: string; sources?: any[] }> {
  // Build data context from referenced columns
  let data: Record<string, any> = {};
  const hasRefs = proc.columns_references && proc.columns_references.length > 0;

  if (hasRefs) {
    const rowCells = await getRowCells(
      supabase,
      rowIdx,
      proc.columns_references!,
    );

    if (rowCells && rowCells.length > 0) {
      data = Object.fromEntries(
        rowCells.map((cell: any) => [cell.columns?.name || cell.column_id, cell.value]),
      );
    }
  }

  switch (proc.task) {
    case 'text-to-image': {
      const finalPrompt = hasRefs
        ? renderInstruction(proc.prompt, data)
        : proc.prompt;
      return generateImage(openai, finalPrompt, proc.model);
    }

    case 'image-text-to-text': {
      // Get image from the image column
      if (!proc.image_column_id) {
        return { error: 'No image column configured for vision task' };
      }
      const imageCells = await getRowCells(supabase, rowIdx, [
        proc.image_column_id,
      ]);
      const imageUrl = imageCells?.[0]?.value;
      if (!imageUrl) {
        return { error: 'No image found in the image column for this row' };
      }
      const finalPrompt = hasRefs
        ? renderInstruction(proc.prompt, data)
        : proc.prompt;
      return analyzeImage(openai, String(imageUrl), finalPrompt, proc.model);
    }

    case 'speech': {
      const textToSpeak = hasRefs
        ? renderInstruction(proc.prompt, data)
        : proc.prompt;
      const speechResult = await generateSpeech(openai, textToSpeak);
      if (speechResult.value) {
        // Convert to base64 data URI for storage
        const base64 = Buffer.from(speechResult.value).toString('base64');
        return { value: `data:audio/mp3;base64,${base64}` };
      }
      return { error: speechResult.error };
    }

    case 'transcription': {
      // Get audio from the image_column_id (repurposed for audio column)
      if (!proc.image_column_id) {
        return { error: 'No audio column configured for transcription' };
      }
      const audioCells = await getRowCells(supabase, rowIdx, [
        proc.image_column_id,
      ]);
      const audioData = audioCells?.[0]?.value;
      if (!audioData) {
        return { error: 'No audio found for this row' };
      }
      // Assume audioData is a base64 data URI
      const base64Data = String(audioData).replace(
        /^data:audio\/[a-z]+;base64,/,
        '',
      );
      const buffer = Buffer.from(base64Data, 'base64');
      return transcribeAudio(openai, buffer.buffer as ArrayBuffer);
    }

    default: {
      // text-generation
      let sourcesContext: { source_uri: string; text: string }[] | undefined;
      let sources: { url: string; snippet: string }[] | undefined;

      if (proc.search_enabled) {
        const searchQuery = hasRefs
          ? renderInstruction(proc.prompt, data)
          : proc.prompt;
        const searchResult = await searchWeb(openai, searchQuery, proc.model);
        if (searchResult.sources) {
          sourcesContext = searchResult.sources.map((s) => ({
            source_uri: s.url,
            text: s.snippet,
          }));
          sources = searchResult.sources;
        }
      }

      const prompt = materializePrompt({
        instruction: proc.prompt,
        data: hasRefs ? data : undefined,
        examples: existingExamples,
        sourcesContext,
        task: proc.task,
      });

      const result = await generateText(openai, prompt, proc.model);
      return { ...result, sources };
    }
  }
}
