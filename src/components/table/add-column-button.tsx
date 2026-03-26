'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDatasetStore } from '@/lib/store/dataset-store';
import { useUIStore } from '@/lib/store/ui-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnKind } from '@/lib/types/domain';

export function AddColumnButton({ datasetId }: { datasetId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ColumnKind>('dynamic');
  const [loading, setLoading] = useState(false);
  const { columns, addColumn } = useDatasetStore();
  const { setSelectedColumnId } = useUIStore();

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const position = columns.length;

    const { data, error } = await supabase
      .from('columns')
      .insert({
        dataset_id: datasetId,
        name: name.trim(),
        type: 'text',
        kind,
        position,
        visible: true,
      })
      .select()
      .single();

    if (!error && data) {
      addColumn({
        id: data.id,
        dataset_id: data.dataset_id,
        name: data.name,
        type: data.type,
        kind: data.kind,
        visible: data.visible,
        position: data.position,
        cells: [],
      });

      if (kind === 'dynamic') {
        setSelectedColumnId(data.id);
      }

      setName('');
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="inline-flex p-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-zinc-500 hover:text-zinc-300"
          onClick={() => setOpen(true)}
        >
          + Add Column
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Column name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., description"
                className="border-zinc-700 bg-zinc-800 text-zinc-100"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Type</label>
              <Select
                value={kind}
                onValueChange={(v) => setKind(v as ColumnKind)}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dynamic">
                    Dynamic (AI-generated)
                  </SelectItem>
                  <SelectItem value="static">Static (manual data)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={loading || !name.trim()}
            >
              {loading ? 'Adding...' : 'Add Column'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
