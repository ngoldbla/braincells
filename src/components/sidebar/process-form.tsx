'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDatasetStore } from '@/lib/store/dataset-store';
import { useUIStore } from '@/lib/store/ui-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Column, TaskType, Provider } from '@/lib/types/domain';

const MODELS = [
  // OpenAI
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' as const },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' as const },
  { value: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai' as const },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', provider: 'openai' as const },
  { value: 'gpt-image-1', label: 'GPT Image 1', provider: 'openai' as const },
  { value: 'o4-mini', label: 'o4-mini', provider: 'openai' as const },
  // Mercury (Inception Labs)
  { value: 'mercury-2', label: 'Mercury 2', provider: 'mercury' as const },
  { value: 'mercury-coder', label: 'Mercury Coder', provider: 'mercury' as const },
  { value: 'mercury-edit', label: 'Mercury Edit', provider: 'mercury' as const },
];

const TASKS: { value: TaskType; label: string }[] = [
  { value: 'text-generation', label: 'Text Generation' },
  { value: 'text-to-image', label: 'Image Generation' },
  { value: 'image-text-to-text', label: 'Vision (Image to Text)' },
  { value: 'speech', label: 'Text to Speech' },
  { value: 'transcription', label: 'Transcription' },
];

// Tasks that Mercury does not support (text-only model)
const MERCURY_UNSUPPORTED_TASKS: TaskType[] = [
  'text-to-image',
  'image-text-to-text',
  'speech',
  'transcription',
];

export function ProcessForm({
  column,
  columns,
  datasetId,
  apiKey,
  provider,
}: {
  column: Column;
  columns: Column[];
  datasetId: string;
  apiKey: string;
  provider: Provider;
}) {
  const { updateColumnProcess, updateCell, setRowCount } =
    useDatasetStore();
  const { setSelectedColumnId, setIsGenerating, setGeneratingColumnId } =
    useUIStore();

  const [prompt, setPrompt] = useState(column.process?.prompt || '');
  const [model, setModel] = useState(column.process?.model || 'gpt-4o-mini');
  const [task, setTask] = useState<TaskType>(
    column.process?.task || 'text-generation',
  );
  const [searchEnabled, setSearchEnabled] = useState(
    column.process?.search_enabled || false,
  );
  const [imageColumnId, setImageColumnId] = useState(
    column.process?.image_column_id || '',
  );
  const [generating, setGenerating] = useState(false);
  const [rowLimit, setRowLimit] = useState(5);

  const availableModels = MODELS.filter((m) => m.provider === provider);

  // When provider changes, reset model to a valid one for that provider
  useEffect(() => {
    const modelBelongsToProvider = availableModels.some((m) => m.value === model);
    if (!modelBelongsToProvider) {
      setModel(availableModels[0]?.value || 'gpt-4o-mini');
    }
  }, [provider]);

  // When provider is mercury and task is unsupported, reset to text-generation
  useEffect(() => {
    if (provider === 'mercury' && MERCURY_UNSUPPORTED_TASKS.includes(task)) {
      setTask('text-generation');
    }
    // Disable web search for mercury (uses OpenAI Responses API)
    if (provider === 'mercury' && searchEnabled) {
      setSearchEnabled(false);
    }
  }, [provider]);

  useEffect(() => {
    setPrompt(column.process?.prompt || '');
    setModel(column.process?.model || 'gpt-4o-mini');
    setTask(column.process?.task || 'text-generation');
    setSearchEnabled(column.process?.search_enabled || false);
    setImageColumnId(column.process?.image_column_id || '');
  }, [column.id, column.process]);

  const insertReference = (colName: string) => {
    setPrompt((prev) => prev + '{{' + colName + '}}');
  };

  const handleSave = async () => {
    const supabase = createClient();
    const refRegex = /\{\{([^}]+)\}\}/g;
    const refs: string[] = [];
    let m;
    while ((m = refRegex.exec(prompt)) !== null) {
      const refName = m[1].trim();
      const refCol = columns.find((c) => c.name === refName);
      if (refCol) refs.push(refCol.id);
    }

    const { data, error } = await supabase
      .from('processes')
      .upsert(
        {
          column_id: column.id,
          prompt,
          model,
          task,
          search_enabled: searchEnabled,
          image_column_id: imageColumnId || null,
        },
        { onConflict: 'column_id' },
      )
      .select()
      .single();

    if (error) {
      toast.error('Failed to save process config');
      return false;
    }

    if (data) {
      await supabase
        .from('process_columns')
        .delete()
        .eq('process_id', data.id);

      if (refs.length > 0) {
        await supabase.from('process_columns').insert(
          refs.map((colId) => ({
            process_id: data.id,
            column_id: colId,
          })),
        );
      }
    }

    updateColumnProcess(column.id, {
      id: data?.id,
      prompt,
      model,
      task,
      search_enabled: searchEnabled,
      image_column_id: imageColumnId || undefined,
      columns_references: refs,
    });

    toast.success('Process saved');
    return true;
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      toast.error('Set your API key in Settings');
      return;
    }

    const saved = await handleSave();
    if (!saved) return;

    setGenerating(true);
    setIsGenerating(true);
    setGeneratingColumnId(column.id);

    const refRegex = /\{\{([^}]+)\}\}/g;
    const refs: string[] = [];
    let m;
    while ((m = refRegex.exec(prompt)) !== null) {
      const refName = m[1].trim();
      const refCol = columns.find((c) => c.name === refName);
      if (refCol) refs.push(refCol.id);
    }

    // Warn if referenced columns appear to have no data
    if (refs.length > 0) {
      const storeState = useDatasetStore.getState();
      for (const refId of refs) {
        const refCol = columns.find((c) => c.id === refId);
        const refCells = storeState.cells[refId];
        const hasCells = refCells && Object.keys(refCells).length > 0;
        if (!hasCells && refCol) {
          toast.warning(`Column '${refCol.name}' has no data. Results may be incomplete.`);
        }
      }
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-ai-provider': provider,
        },
        body: JSON.stringify({
          dataset_id: datasetId,
          column_id: column.id,
          column_name: column.name,
          process: {
            prompt,
            model,
            task,
            search_enabled: searchEnabled,
            image_column_id: imageColumnId || undefined,
            columns_references: refs,
          },
          offset: 0,
          limit: rowLimit,
        }),
      });

      if (!res.ok || !res.body) {
        toast.error('Generation failed');
        setGenerating(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let completedCount = 0;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.event === 'cell.generating') {
              updateCell(column.id, {
                row_idx: data.row_idx,
                generating: true,
                validated: false,
              });
            }

            if (data.event === 'cell.complete') {
              completedCount++;
              updateCell(column.id, {
                row_idx: data.row_idx,
                value: data.value,
                error: data.error,
                generating: false,
                validated: false,
                sources: data.sources,
              });
              const currentRowCount = useDatasetStore.getState().rowCount;
              if (data.row_idx >= currentRowCount) {
                setRowCount(data.row_idx + 1);
              }
            }

            if (data.event === 'generation.error') {
              toast.error(data.error);
            }
          } catch (parseErr) {
            console.warn('[generate] malformed SSE line:', line, parseErr);
          }
        }
      }

      if (completedCount === 0) {
        toast.warning('No cells were generated. Check that referenced columns have data.');
      } else {
        toast.success('Generated ' + completedCount + ' cells');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Generation failed',
      );
    }

    setGenerating(false);
    setIsGenerating(false);
    setGeneratingColumnId(null);
  };

  const otherColumns = columns.filter((c) => c.id !== column.id);
  const imageColumns = columns.filter(
    (c) => c.type === 'image' || c.process?.task === 'text-to-image',
  );
  const needsImageColumn =
    task === 'image-text-to-text' || task === 'transcription';
  const isMercury = provider === 'mercury';

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm font-semibold text-zinc-200">
          {column.name}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-zinc-500"
          onClick={() => setSelectedColumnId(null)}
        >
          Close
        </Button>
      </div>

      <Separator className="bg-zinc-800" />

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">Task</label>
        <Select
          value={task}
          onValueChange={(v) => {
            setTask(v as TaskType);
            if (v === 'text-to-image') setModel('gpt-image-1');
            else if (model === 'gpt-image-1') setModel(availableModels[0]?.value || 'gpt-4o-mini');
          }}
        >
          <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-100 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASKS.map((t) => {
              const disabled = isMercury && MERCURY_UNSUPPORTED_TASKS.includes(t.value);
              return (
                <SelectItem
                  key={t.value}
                  value={t.value}
                  disabled={disabled}
                >
                  {t.label}
                  {disabled && ' (OpenAI only)'}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">Model</label>
        <Select value={model} onValueChange={(v) => v && setModel(v)}>
          <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-100 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Draw a picture of {{subject}} in the style of {{style}} for {{season}}"
          rows={5}
          className="border-zinc-700 bg-zinc-800 text-zinc-100 text-xs font-mono"
        />
        {otherColumns.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-zinc-600 mr-1 self-center">
              Insert:
            </span>
            {otherColumns.map((c) => (
              <button
                key={c.id}
                onClick={() => insertReference(c.name)}
                className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
              >
                {'{{' + c.name + '}}'}
              </button>
            ))}
          </div>
        )}
      </div>

      {needsImageColumn && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">
            {task === 'transcription'
              ? 'Audio Source Column'
              : 'Image Source Column'}
          </label>
          <Select value={imageColumnId} onValueChange={(v) => v && setImageColumnId(v)}>
            <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-100 text-xs">
              <SelectValue placeholder="Select column..." />
            </SelectTrigger>
            <SelectContent>
              {(task === 'transcription' ? columns : imageColumns).map(
                (c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {task === 'text-generation' && !isMercury && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="search"
            checked={searchEnabled}
            onCheckedChange={(checked) =>
              setSearchEnabled(checked as boolean)
            }
          />
          <label htmlFor="search" className="text-xs text-zinc-400">
            Enable web search
          </label>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400">
          Rows to generate
        </label>
        <Input
          type="number"
          min={1}
          max={100}
          value={rowLimit}
          onChange={(e) => setRowLimit(Number(e.target.value))}
          className="border-zinc-700 bg-zinc-800 text-zinc-100 text-xs w-20"
        />
      </div>

      <Separator className="bg-zinc-800" />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleSave}
        >
          Save
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
        >
          {generating ? 'Generating...' : 'Generate'}
        </Button>
      </div>

      {generating && (
        <div className="text-xs text-zinc-500 animate-pulse">
          Generating cells... This may take a moment.
        </div>
      )}
    </div>
  );
}
