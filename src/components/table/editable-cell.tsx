'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CellRenderer } from './cell-renderer';
import { useUIStore } from '@/lib/store/ui-store';
import { useDatasetStore } from '@/lib/store/dataset-store';
import { upsertCellValue } from '@/lib/supabase/queries/cells';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { TaskType } from '@/lib/types/domain';

export function EditableCell({
  columnId,
  rowIdx,
  value,
  type,
  generating,
  error,
  task,
  datasetId,
}: {
  columnId: string;
  rowIdx: number;
  value: any;
  type: string;
  generating?: boolean;
  error?: string;
  task?: TaskType;
  datasetId: string;
}) {
  const isFocused = useUIStore(
    (s) => s.focusedCell?.columnId === columnId && s.focusedCell?.rowIdx === rowIdx,
  );
  const isEditing = useUIStore(
    (s) => s.editingCell?.columnId === columnId && s.editingCell?.rowIdx === rowIdx,
  );
  const setFocusedCell = useUIStore((s) => s.setFocusedCell);
  const setEditingCell = useUIStore((s) => s.setEditingCell);
  const updateCell = useDatasetStore((s) => s.updateCell);

  const [localValue, setLocalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Seed local value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setLocalValue(value != null ? String(value) : '');
      // Focus textarea on next tick after render
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [isEditing, value]);

  const enterEdit = useCallback(() => {
    setFocusedCell({ columnId, rowIdx });
    setEditingCell({ columnId, rowIdx });
  }, [columnId, rowIdx, setFocusedCell, setEditingCell]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, [setEditingCell]);

  const saveEdit = useCallback(async () => {
    setEditingCell(null);
    const trimmed = localValue.trim();
    const newValue = trimmed === '' ? null : trimmed;

    // Skip if unchanged
    if (newValue === (value != null ? String(value) : null)) return;

    // Optimistic update
    updateCell(columnId, { row_idx: rowIdx, value: newValue, generating: false, validated: false });

    try {
      const supabase = createClient();
      await upsertCellValue(supabase, {
        dataset_id: datasetId,
        column_id: columnId,
        row_idx: rowIdx,
        value: newValue,
      });
    } catch (err) {
      toast.error('Failed to save cell');
      // Revert optimistic update
      updateCell(columnId, { row_idx: rowIdx, value, generating: false, validated: false });
    }
  }, [localValue, value, columnId, rowIdx, datasetId, updateCell, setEditingCell]);

  const handleClick = useCallback(() => {
    if (!isEditing) {
      setFocusedCell({ columnId, rowIdx });
    }
  }, [isEditing, columnId, rowIdx, setFocusedCell]);

  const handleDoubleClick = useCallback(() => {
    enterEdit();
  }, [enterEdit]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cancelEdit();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        saveEdit();
      }
    },
    [cancelEdit, saveEdit],
  );

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={saveEdit}
        onKeyDown={handleTextareaKeyDown}
        className="w-full h-full resize-none bg-zinc-900 text-xs text-zinc-200 border border-blue-500 rounded px-1.5 py-1 outline-none"
        rows={4}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`h-full cursor-default ${
        isFocused ? 'ring-2 ring-blue-500/70 ring-inset rounded-sm' : ''
      }`}
    >
      <CellRenderer
        value={value}
        type={type}
        generating={generating}
        error={error}
        task={task}
      />
    </div>
  );
}
