'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useOpenAIKey } from '@/hooks/use-openai-key';
import type { Dataset } from '@/lib/types/domain';

export function ImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (dataset: Dataset) => void;
}) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file || !name.trim()) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create the dataset first
    const { data: dataset, error: createError } = await supabase
      .from('datasets')
      .insert({ name: name.trim(), user_id: user!.id })
      .select()
      .single();

    if (createError || !dataset) {
      setError('Failed to create dataset');
      setLoading(false);
      return;
    }

    // Upload file to import endpoint
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_id', dataset.id);
    formData.append(
      'file_type',
      file.name.endsWith('.json') ? 'json' : 'csv',
    );

    const res = await fetch('/api/import', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || 'Import failed');
      setLoading(false);
      return;
    }

    onImported(dataset);
    setName('');
    setFile(null);
    onOpenChange(false);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            Import Dataset
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Dataset name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Dataset"
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">
              File (CSV or JSON)
            </label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || !name.trim() || !file}
          >
            {loading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
