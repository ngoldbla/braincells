import { useCallback, useEffect } from 'react';
import { useUIStore } from '@/lib/store/ui-store';
import { useDatasetStore } from '@/lib/store/dataset-store';
import { upsertCellValue } from '@/lib/supabase/queries/cells';
import { createClient } from '@/lib/supabase/client';
import type { Virtualizer } from '@tanstack/react-virtual';

export function useSpreadsheetKeyboard(
  containerRef: React.RefObject<HTMLDivElement | null>,
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  visibleColumnIds: string[],
  rowCount: number,
  datasetId: string,
) {
  const focusedCell = useUIStore((s) => s.focusedCell);
  const editingCell = useUIStore((s) => s.editingCell);
  const setFocusedCell = useUIStore((s) => s.setFocusedCell);
  const setEditingCell = useUIStore((s) => s.setEditingCell);
  const updateCell = useDatasetStore((s) => s.updateCell);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // No-op while editing — textarea handles its own keys
      if (editingCell) return;
      if (!focusedCell) return;

      const colIdx = visibleColumnIds.indexOf(focusedCell.columnId);
      if (colIdx === -1) return;

      const move = (newColIdx: number, newRowIdx: number) => {
        const clampedRow = Math.max(0, Math.min(rowCount - 1, newRowIdx));
        const clampedCol = Math.max(0, Math.min(visibleColumnIds.length - 1, newColIdx));
        setFocusedCell({ columnId: visibleColumnIds[clampedCol], rowIdx: clampedRow });
        virtualizer.scrollToIndex(clampedRow);
      };

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          move(colIdx, focusedCell.rowIdx - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          move(colIdx, focusedCell.rowIdx + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          move(colIdx - 1, focusedCell.rowIdx);
          break;
        case 'ArrowRight':
          e.preventDefault();
          move(colIdx + 1, focusedCell.rowIdx);
          break;
        case 'Tab': {
          e.preventDefault();
          const dir = e.shiftKey ? -1 : 1;
          let nextCol = colIdx + dir;
          let nextRow = focusedCell.rowIdx;
          if (nextCol >= visibleColumnIds.length) {
            nextCol = 0;
            nextRow++;
          } else if (nextCol < 0) {
            nextCol = visibleColumnIds.length - 1;
            nextRow--;
          }
          move(nextCol, nextRow);
          break;
        }
        case 'Enter':
        case 'F2':
          e.preventDefault();
          setEditingCell({ columnId: focusedCell.columnId, rowIdx: focusedCell.rowIdx });
          break;
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          // Clear the focused cell value
          updateCell(focusedCell.columnId, {
            row_idx: focusedCell.rowIdx,
            value: null,
            generating: false,
            validated: false,
          });
          const supabase = createClient();
          upsertCellValue(supabase, {
            dataset_id: datasetId,
            column_id: focusedCell.columnId,
            row_idx: focusedCell.rowIdx,
            value: null,
          }).catch(() => {
            // silent — realtime will reconcile
          });
          break;
        }
      }
    },
    [focusedCell, editingCell, visibleColumnIds, rowCount, datasetId, setFocusedCell, setEditingCell, updateCell, virtualizer],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('keydown', handleKeyDown);
    return () => el.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);
}
