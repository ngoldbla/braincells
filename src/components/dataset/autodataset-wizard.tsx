'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useOpenAIKey } from '@/hooks/use-openai-key';

interface WizardStep {
  event: string;
  label: string;
  done: boolean;
}

export function AutoDatasetWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (datasetId: string) => void;
}) {
  const [instruction, setInstruction] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<WizardStep[]>([]);
  const [error, setError] = useState('');
  const { apiKey, hasKey, provider } = useOpenAIKey();

  const handleRun = async () => {
    if (!instruction.trim() || !hasKey) return;
    setRunning(true);
    setError('');
    setSteps([
      { event: 'config', label: 'Generating dataset structure...', done: false },
    ]);

    try {
      const res = await fetch('/api/autodataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-ai-provider': provider,
        },
        body: JSON.stringify({
          instruction: instruction.trim(),
          search_enabled: searchEnabled,
        }),
      });

      if (!res.ok || !res.body) {
        setError('Failed to start AutoDataset');
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let datasetId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.event) {
              case 'dataset.config':
                setSteps((s) => [
                  { ...s[0], done: true },
                  {
                    event: 'create',
                    label: 'Creating dataset...',
                    done: false,
                  },
                ]);
                break;

              case 'dataset.create.success':
                datasetId = data.dataset.id;
                setSteps((s) => [
                  ...s.map((st) => ({ ...st, done: true })),
                  {
                    event: 'populate',
                    label: 'Generating initial rows...',
                    done: false,
                  },
                ]);
                break;

              case 'dataset.populate.success':
                setSteps((s) => s.map((st) => ({ ...st, done: true })));
                if (datasetId) {
                  onCreated(datasetId);
                  onOpenChange(false);
                }
                break;

              case 'dataset.config.error':
              case 'generic.error':
                setError(data.error || 'Unknown error');
                break;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }

    setRunning(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            AutoDataset
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasKey && (
            <div className="rounded-md bg-amber-900/50 p-3 text-sm text-amber-300">
              Set your OpenAI API key in Settings first
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">
              Describe the dataset you want to create
            </label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Famous paintings with artist name, year, style, and a generated image of each painting"
              rows={4}
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
              disabled={running}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="search"
              checked={searchEnabled}
              onCheckedChange={(checked) =>
                setSearchEnabled(checked as boolean)
              }
              disabled={running}
            />
            <label htmlFor="search" className="text-sm text-zinc-400">
              Enable web search for real-world data
            </label>
          </div>

          {steps.length > 0 && (
            <div className="space-y-2 rounded-md border border-zinc-800 p-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {step.done ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="animate-pulse text-zinc-500">●</span>
                  )}
                  <span
                    className={
                      step.done ? 'text-zinc-400' : 'text-zinc-200'
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={running}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRun}
            disabled={running || !instruction.trim() || !hasKey}
          >
            {running ? 'Generating...' : 'Generate Dataset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
