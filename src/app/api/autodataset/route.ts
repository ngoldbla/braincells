import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOpenAIClient } from '@/lib/openai/client';
import { generateText } from '@/lib/openai/text-generation';
import {
  processTextConfigResponse,
  SEARCH_PROMPT_TEMPLATE,
  NO_SEARCH_PROMPT_TEMPLATE,
} from '@/lib/utils/autodataset-parser';
import { extractColumnReferences } from '@/lib/utils/prompt-template';
import { createColumn, getMaxPosition } from '@/lib/supabase/queries/columns';
import { createDataset } from '@/lib/supabase/queries/datasets';
import { upsertProcess } from '@/lib/supabase/queries/processes';
import { DEFAULT_MODEL } from '@/lib/types/domain';
import type { TaskType } from '@/lib/types/domain';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-openai-api-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing OpenAI API key' }), {
      status: 401,
    });
  }

  const {
    instruction,
    model = DEFAULT_MODEL,
    search_enabled = false,
  } = await request.json();

  const supabase = await createClient();
  const openai = createOpenAIClient(apiKey);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`),
        );
      };

      try {
        // Step 1: Get dataset config from LLM
        send('dataset.config', {});

        const promptText = search_enabled
          ? SEARCH_PROMPT_TEMPLATE.replace('{instruction}', instruction).replace(
              '{maxSearchQueries}',
              '1',
            )
          : NO_SEARCH_PROMPT_TEMPLATE.replace('{instruction}', instruction);

        const configResult = await generateText(openai, promptText, model);

        if (configResult.error || !configResult.value) {
          send('dataset.config.error', {
            error: configResult.error || 'No response from model',
          });
          controller.close();
          return;
        }

        const config = processTextConfigResponse(
          configResult.value,
          search_enabled,
        );

        if (config.columns.length === 0) {
          send('dataset.config.error', {
            error: 'No columns found in model response',
          });
          controller.close();
          return;
        }

        // Step 2: Create dataset and columns
        send('dataset.create', { name: config.datasetName });

        const dataset = await createDataset(
          supabase,
          config.datasetName,
          user.id,
        );

        const columnNames = config.columns.map((c) => c.name);
        const createdColumns: Array<{ id: string; name: string; type: string }> =
          [];

        for (let i = 0; i < config.columns.length; i++) {
          const col = config.columns[i];
          const isImage = col.type === 'image';

          const created = await createColumn(supabase, {
            dataset_id: dataset.id,
            name: col.name,
            type: isImage ? 'image' : 'text',
            kind: 'dynamic',
            position: i,
          });

          createdColumns.push({
            id: created.id,
            name: col.name,
            type: isImage ? 'image' : 'text',
          });
        }

        // Step 3: Create processes with column references
        for (let i = 0; i < config.columns.length; i++) {
          const col = config.columns[i];
          const created = createdColumns[i];
          const isImage = col.type === 'image';

          const refs = extractColumnReferences(col.prompt, columnNames);
          const refIds = refs
            .map((refName) => {
              const refCol = createdColumns.find((c) => c.name === refName);
              return refCol?.id;
            })
            .filter(Boolean) as string[];

          const task: TaskType = isImage ? 'text-to-image' : 'text-generation';

          await upsertProcess(supabase, {
            column_id: created.id,
            prompt: col.prompt,
            model: isImage ? 'gpt-image-1' : model,
            task,
            search_enabled,
            columns_references: refIds,
          });
        }

        send('dataset.create.success', {
          dataset: { id: dataset.id, name: dataset.name },
          columns: config.columns,
        });

        // Step 4: Generate initial rows (5 per column)
        send('dataset.populate', { dataset_id: dataset.id });

        // Trigger generation for each column via the generate endpoint
        // We do this inline to avoid circular HTTP calls
        for (const col of createdColumns) {
          const maxPos = await getMaxPosition(supabase, dataset.id);
          send('column.generating', {
            column_id: col.id,
            column_name: col.name,
          });

          // Fire a fetch to our own generate endpoint
          const generateUrl = new URL('/api/generate', request.url);
          const colConfig = config.columns.find((c) => c.name === col.name);
          const refs = extractColumnReferences(
            colConfig?.prompt || '',
            columnNames,
          );
          const refIds = refs
            .map((refName) => {
              const refCol = createdColumns.find((c) => c.name === refName);
              return refCol?.id;
            })
            .filter(Boolean) as string[];

          const isImage = col.type === 'image';

          await fetch(generateUrl.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-openai-api-key': apiKey,
              Cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify({
              dataset_id: dataset.id,
              column_id: col.id,
              column_name: col.name,
              process: {
                prompt: colConfig?.prompt || '',
                model: isImage ? 'gpt-image-1' : model,
                task: isImage ? 'text-to-image' : 'text-generation',
                search_enabled,
                columns_references: refIds,
              },
              offset: 0,
              limit: 5,
            }),
          });

          send('column.generated', { column_id: col.id });
        }

        send('dataset.populate.success', {
          dataset: { id: dataset.id, name: dataset.name },
        });

        controller.close();
      } catch (err) {
        send('generic.error', {
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
