'use client';

import { useEffect, useCallback, useState } from 'react';
import { useDatasetStore } from '@/lib/store/dataset-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useRealtimeCells } from '@/hooks/use-realtime-cells';
import { useOpenAIKey } from '@/hooks/use-openai-key';
import { createClient } from '@/lib/supabase/client';
import { TableHeader } from './table-header';
import { TableBody } from './table-body';
import { ProcessForm } from '@/components/sidebar/process-form';
import { AddColumnButton } from './add-column-button';
import type { Dataset, Column, Cell } from '@/lib/types/domain';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function Spreadsheet({
  dataset,
  initialColumns,
}: {
  dataset: Dataset;
  initialColumns: any[];
}) {
  const {
    setActiveDataset,
    setColumns,
    columns,
    setRowCount,
    rowCount,
    mergeCells,
  } = useDatasetStore();
  const { sidebarOpen, selectedColumnId } = useUIStore();
  const { apiKey, hasKey, provider } = useOpenAIKey();
  const [initialLoad, setInitialLoad] = useState(true);

  useRealtimeCells(dataset.id);

  // Reset cell loading when navigating to a different dataset
  useEffect(() => {
    setInitialLoad(true);
  }, [dataset.id]);

  // Initialize store
  useEffect(() => {
    setActiveDataset(dataset);

    // Map server columns to client format
    const mapped: Column[] = initialColumns.map((col) => ({
      id: col.id,
      dataset_id: col.dataset_id,
      name: col.name,
      type: col.type,
      kind: col.kind,
      visible: col.visible,
      position: col.position,
      process: col.processes?.[0]
        ? {
            id: col.processes[0].id,
            prompt: col.processes[0].prompt,
            model: col.processes[0].model,
            task: col.processes[0].task,
            search_enabled: col.processes[0].search_enabled,
            image_column_id: col.processes[0].image_column_id,
          }
        : undefined,
      cells: [],
    }));

    setColumns(mapped);
  }, [dataset, initialColumns, setActiveDataset, setColumns]);

  // Load cell data
  useEffect(() => {
    if (columns.length === 0 || !initialLoad) return;

    const loadCells = async () => {
      const supabase = createClient();
      const columnIds = columns.map((c) => c.id);

      const { data, error } = await supabase
        .from('cell_values')
        .select('*')
        .eq('dataset_id', dataset.id)
        .in('column_id', columnIds)
        .order('row_idx', { ascending: true })
        .limit(1000);

      if (error) {
        toast.error(error.message || 'Failed to load cell data');
        setInitialLoad(false);
        return;
      }

      if (data) {
        // Group by column
        const byColumn = new Map<string, Cell[]>();
        let maxRow = 0;

        for (const row of data) {
          if (!byColumn.has(row.column_id)) {
            byColumn.set(row.column_id, []);
          }
          byColumn.get(row.column_id)!.push({
            row_idx: row.row_idx,
            value: row.value,
            generating: false,
            validated: false,
          });
          maxRow = Math.max(maxRow, row.row_idx);
        }

        for (const [colId, cells] of byColumn) {
          mergeCells(colId, cells);
        }

        setRowCount(maxRow + 1);
      }

      setInitialLoad(false);
    };

    loadCells();
  }, [columns.length, dataset.id, initialLoad, mergeCells, setRowCount]);

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      const url = `/api/export?dataset_id=${dataset.id}&format=${format}`;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${dataset.name}.${format}`;
      a.click();
    },
    [dataset],
  );

  const selectedColumn = columns.find((c) => c.id === selectedColumnId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <h2 className="font-mono text-sm font-semibold text-zinc-200">
          {dataset.name}
        </h2>
        <div className="flex items-center gap-2">
          {!hasKey && (
            <span className="text-xs text-amber-400">
              Set API key in Settings
            </span>
          )}
          <span className="text-xs text-zinc-600">
            {rowCount} rows · {columns.length} columns
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => handleExport('json')}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-hidden">
          <div className="min-w-max">
            <TableHeader
              columns={columns}
              datasetId={dataset.id}
            />
            <TableBody
              columns={columns}
              rowCount={rowCount}
              datasetId={dataset.id}
            />
            <AddColumnButton datasetId={dataset.id} />
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && selectedColumn && (
          <div className="w-80 shrink-0 border-l border-zinc-800 overflow-y-auto">
            <ProcessForm
              column={selectedColumn}
              columns={columns}
              datasetId={dataset.id}
              apiKey={apiKey}
              provider={provider}
            />
          </div>
        )}
      </div>
    </div>
  );
}
