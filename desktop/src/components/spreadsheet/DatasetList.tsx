import { useState } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheet-store';
import { Button } from '../common';

interface DatasetListProps {
  onCreateDataset: () => void;
}

export function DatasetList({ onCreateDataset }: DatasetListProps) {
  const { datasets, selectedDatasetId, selectDataset, deleteDataset } =
    useSpreadsheetStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (datasetId: string, datasetName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${datasetName}"? This action cannot be undone.`
      )
    ) {
      setDeletingId(datasetId);
      try {
        await deleteDataset(datasetId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Datasets</h2>
        <Button variant="primary" size="sm" onClick={onCreateDataset} className="w-full">
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
      </div>

      {/* Dataset List */}
      <div className="flex-1 overflow-y-auto">
        {datasets.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>No datasets yet.</p>
            <p className="mt-1">Create one to get started!</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={`group relative rounded-lg transition-colors ${
                  selectedDatasetId === dataset.id
                    ? 'bg-indigo-100 border border-indigo-300'
                    : 'bg-white border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => selectDataset(dataset.id)}
                  className="w-full text-left p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                  disabled={deletingId === dataset.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium truncate ${
                          selectedDatasetId === dataset.id
                            ? 'text-indigo-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {dataset.name}
                      </h3>
                      {dataset.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {dataset.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(dataset.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Delete button - shown on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(dataset.id, dataset.name);
                      }}
                      disabled={deletingId === dataset.id}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      title="Delete dataset"
                    >
                      {deletingId === dataset.id ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
