'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CellRenderer } from './cell-renderer';
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

  const virtualizer = useVirtualizer({
    count: Math.max(rowCount, 1),
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const visibleColumns = columns.filter((c) => c.visible);

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
      className="h-[calc(100vh-3.5rem-3rem)]"
      style={{ overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
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
            {/* Row index */}
            <div className="flex w-12 shrink-0 items-start justify-center border-r border-zinc-800/50 p-2 text-xs text-zinc-600 font-mono">
              {virtualRow.index}
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
                  <CellRenderer
                    value={cell?.value}
                    type={col.type}
                    generating={cell?.generating}
                    error={cell?.error}
                    task={col.process?.task}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
