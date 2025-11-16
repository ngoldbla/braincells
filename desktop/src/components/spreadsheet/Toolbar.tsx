import React, { useRef } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheet-store';
import { Button, Select } from '../common';

interface ToolbarProps {
  onAddColumn: () => void;
  onAddDataset: () => void;
}

export function Toolbar({ onAddColumn, onAddDataset }: ToolbarProps) {
  const {
    datasets,
    selectedDatasetId,
    currentTableView,
    selectDataset,
    refreshTableView,
    importCsv,
    exportCsv,
    generateCells,
  } = useSpreadsheetStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDatasetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const datasetId = e.target.value;
    if (datasetId) {
      selectDataset(datasetId);
    }
  };

  const handleRefresh = () => {
    refreshTableView();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      await importCsv(content);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to import CSV:', error);
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = await exportCsv();

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTableView?.dataset.name || 'export'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const handleGenerateAI = async () => {
    if (!currentTableView) return;

    // Find all Output columns
    const outputColumns = currentTableView.columns.filter(
      (col) => col.column_type === 'output'
    );

    if (outputColumns.length === 0) {
      alert('No AI Output columns found. Add an Output column first.');
      return;
    }

    try {
      // Generate cells for each Output column
      for (const column of outputColumns) {
        await generateCells(column.id);
      }
    } catch (error) {
      console.error('Failed to generate AI cells:', error);
    }
  };

  const datasetOptions = [
    { value: '', label: 'Select a dataset...' },
    ...datasets.map((dataset) => ({
      value: dataset.id,
      label: dataset.name,
    })),
  ];

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
      {/* Left side - Dataset selector */}
      <div className="flex items-center gap-4 flex-1">
        <Select
          value={selectedDatasetId || ''}
          onChange={handleDatasetChange}
          options={datasetOptions}
          className="min-w-[250px]"
        />

        {currentTableView && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {currentTableView.total_rows} {currentTableView.total_rows === 1 ? 'row' : 'rows'}
            </span>
            <span>•</span>
            <span>
              {currentTableView.columns.length} {currentTableView.columns.length === 1 ? 'column' : 'columns'}
            </span>
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onAddDataset}>
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Dataset
        </Button>

        {selectedDatasetId && (
          <>
            <Button variant="ghost" size="sm" onClick={onAddColumn}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Column
            </Button>

            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </Button>

            <Button variant="ghost" size="sm" onClick={handleImportClick}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Import CSV
            </Button>

            <Button variant="ghost" size="sm" onClick={handleExport}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Export CSV
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-2" />

            <Button variant="primary" size="sm" onClick={handleGenerateAI}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate AI Cells
            </Button>
          </>
        )}
      </div>

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
