import { useState, useEffect } from 'react';
import { useSpreadsheetStore } from '../../stores/spreadsheet-store';
import { DatasetList } from './DatasetList';
import { Toolbar } from './Toolbar';
import { SpreadsheetTable } from './SpreadsheetTable';
import { Pagination } from './Pagination';
import { CreateDatasetDialog } from './CreateDatasetDialog';
import { AddColumnDialog } from './AddColumnDialog';

export function Spreadsheet() {
  const { loadDatasets, datasets, selectedDatasetId } = useSpreadsheetStore();
  const [isCreateDatasetOpen, setIsCreateDatasetOpen] = useState(false);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load datasets on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadDatasets();
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeData();
  }, [loadDatasets]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-lg">Loading Braincells...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Dataset List */}
      <DatasetList onCreateDataset={() => setIsCreateDatasetOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          onAddColumn={() => setIsAddColumnOpen(true)}
          onAddDataset={() => setIsCreateDatasetOpen(true)}
        />

        {/* Spreadsheet Table */}
        <div className="flex-1 overflow-auto p-4">
          {datasets.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                <h2 className="mt-4 text-2xl font-semibold text-gray-900">
                  Welcome to Braincells
                </h2>
                <p className="mt-2 text-gray-600">
                  Get started by creating your first dataset. A dataset is like a spreadsheet
                  where you can store data, add AI-powered columns, and apply formulas.
                </p>
                <button
                  onClick={() => setIsCreateDatasetOpen(true)}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create Your First Dataset
                </button>
              </div>
            </div>
          ) : (
            <SpreadsheetTable />
          )}
        </div>

        {/* Pagination */}
        {selectedDatasetId && <Pagination />}
      </div>

      {/* Dialogs */}
      <CreateDatasetDialog
        isOpen={isCreateDatasetOpen}
        onClose={() => setIsCreateDatasetOpen(false)}
      />
      <AddColumnDialog
        isOpen={isAddColumnOpen}
        onClose={() => setIsAddColumnOpen(false)}
      />
    </div>
  );
}
