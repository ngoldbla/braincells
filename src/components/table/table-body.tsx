'use client';

import { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EditableCell } from './editable-cell';
import { useSpreadsheetKeyboard } from '@/hooks/use-spreadsheet-keyboard';
import { useUIStore } from '@/lib/store/ui-store';
import { useDatasetStore } from '@/lib/store/dataset-store';
import { deleteCellValues } from '@/lib/supabase/queries/cells';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { Column } from '@/lib/types/domain';

const ROW_HEIGHT = 105;
const OVERSCAN = 3;

export function TableBody({
  columns,
  rowCount,
  datasetId,
}: {
  columns: Column[];
  rowCount: number;
  datasetId: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const setRowCount = useDatasetStore((s) => s.setRowCount);
  const clearRow = useDatasetStore((s) => s.clearRow);
  const setFocusedCell = useUIStore((s) => s.setFocusedCell);
  const setEditingCell = useUIStore((s) => s.setEditingCell);

  const virtualizer = useVirtualizer({
    count: Math.max(rowCount, 1),
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);
  const visibleColumnIds = useMemo(() => visibleColumns.map((c) => c.id), [visibleColumns]);

  useSpreadsheetKeyboard(parentRef, virtualizer, visibleColumnIds, rowCount, datasetId);

  const handleAddRow = useCallback(() => {
    setRowCount(rowCount + 1);
  }, [rowCount, setRowCount]);

  const handleClearRow = useCallback(
    async (rowIdx: number) => {
      clearRow(rowIdx);
      setFocusedCell(null);
      setEditingCell(null);
      try {
        const supabase = createClient();
        await deleteCellValues(supabase, datasetId, [rowIdx]);
      } catch {
        toast.error('Failed to clear row');
      }
    },
    [datasetId, clearRow, setFocusedCell, setEditingCell],
  );

  if (visibleColumns.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-600">
        No columns yet. Add a column to get started.
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      tabIndex={0}
      className="h-[calc(100vh-3.5rem-3rem)] outline-none"
      style={{ overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize() + ROW_HEIGHT}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            className="absolute left-0 top-0 flex w-full border-b border-zinc-800/50"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {/* Row index + clear button */}
            <div className="group flex w-12 shrink-0 items-start justify-center border-r border-zinc-800/50 p-2 text-xs text-zinc-600 font-mono relative">
              <span>{virtualRow.index}</span>
              <button
                onClick={() => handleClearRow(virtualRow.index)}
                className="absolute top-1.5 right-0.5 hidden group-hover:flex items-center justify-center w-5 h-5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                title="Clear row"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Cells */}
            {visibleColumns.map((col) => {
              const cell = col.cells.find(
                (c) => c.row_idx === virtualRow.index,
              );

              return (
                <div
                  key={col.id}
                  className="w-56 shrink-0 border-r border-zinc-800/50 p-2 overflow-hidden"
                >
                  <EditableCell
                    columnId={col.id}
                    rowIdx={virtualRow.index}
                    value={cell?.value}
                    type={col.type}
                    generating={cell?.generating}
                    error={cell?.error}
                    task={col.process?.task}
                    datasetId={datasetId}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Add Row button — positioned after the last virtual row */}
        <div
          className="absolute left-0 top-0 flex w-full"
          style={{
            transform: `translateY(${virtualizer.getTotalSize()}px)`,
          }}
        >
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
        </div>
      </div>
    </div>
  );
}
