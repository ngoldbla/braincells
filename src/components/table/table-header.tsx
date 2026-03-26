'use client';

import { useUIStore } from '@/lib/store/ui-store';
import { useDatasetStore } from '@/lib/store/dataset-store';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Column } from '@/lib/types/domain';

export function TableHeader({
  columns,
  datasetId,
}: {
  columns: Column[];
  datasetId: string;
}) {
  const { setSelectedColumnId, selectedColumnId } = useUIStore();
  const { removeColumn } = useDatasetStore();

  const handleDelete = async (col: Column) => {
    const supabase = createClient();
    await supabase.from('columns').delete().eq('id', col.id);
    removeColumn(col.id);
    if (selectedColumnId === col.id) {
      setSelectedColumnId(null);
    }
  };

  const visibleColumns = columns.filter((c) => c.visible);

  return (
    <div className="sticky top-0 z-10 flex border-b border-zinc-800 bg-zinc-950">
      {/* Row index column */}
      <div className="flex w-12 shrink-0 items-center justify-center border-r border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-600">
        #
      </div>

      {visibleColumns.map((col) => (
        <div
          key={col.id}
          className={`flex w-56 shrink-0 items-center justify-between border-r border-zinc-800 px-3 py-2 ${
            selectedColumnId === col.id
              ? 'bg-zinc-800'
              : 'bg-zinc-950 hover:bg-zinc-900'
          }`}
        >
          <button
            className="flex items-center gap-2 text-left"
            onClick={() =>
              setSelectedColumnId(
                selectedColumnId === col.id ? null : col.id,
              )
            }
          >
            <span className="text-sm font-medium text-zinc-200 truncate max-w-[120px]">
              {col.name}
            </span>
            {col.kind === 'dynamic' && (
              <Badge
                variant="secondary"
                className="shrink-0 bg-zinc-800 text-[10px] text-zinc-400"
              >
                {col.process?.task === 'text-to-image'
                  ? 'IMG'
                  : col.process?.task === 'image-text-to-text'
                    ? 'VIS'
                    : col.process?.task === 'speech'
                      ? 'TTS'
                      : col.process?.task === 'transcription'
                        ? 'STT'
                        : 'AI'}
              </Badge>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300">
              ⋮
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setSelectedColumnId(col.id)}
              >
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400"
                onClick={() => handleDelete(col)}
              >
                Delete column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
