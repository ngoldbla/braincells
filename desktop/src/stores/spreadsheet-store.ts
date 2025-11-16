import { create } from 'zustand';
import type { Dataset, Column, TableView, Cell, ColumnType } from '../types/database';
import * as api from '../lib/tauri-api';

interface SpreadsheetState {
  // Current dataset being viewed/edited
  currentDataset: Dataset | null;
  currentTableView: TableView | null;
  selectedDatasetId: string | null;

  // Available datasets
  datasets: Dataset[];

  // UI state
  loading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;

  // Actions - Dataset management
  loadDatasets: () => Promise<void>;
  createDataset: (name: string, description?: string) => Promise<Dataset>;
  selectDataset: (datasetId: string) => Promise<void>;
  deleteDataset: (datasetId: string) => Promise<void>;

  // Actions - Table view
  loadTableView: (datasetId: string, page?: number) => Promise<void>;
  refreshTableView: () => Promise<void>;

  // Actions - Column management
  addColumn: (name: string, columnType: ColumnType, prompt?: string, providerId?: string) => Promise<Column>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Actions - Cell management
  updateCell: (columnId: string, rowIndex: number, value: string) => Promise<void>;

  // Actions - Import/Export
  importCsv: (csvContent: string) => Promise<void>;
  exportCsv: () => Promise<string>;

  // Actions - Pagination
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  setRowsPerPage: (rows: number) => Promise<void>;

  // Actions - Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSpreadsheetStore = create<SpreadsheetState>((set, get) => ({
  // Initial state
  currentDataset: null,
  currentTableView: null,
  selectedDatasetId: null,
  datasets: [],
  loading: false,
  error: null,
  currentPage: 0,
  rowsPerPage: 100,
  totalRows: 0,

  // Dataset management
  loadDatasets: async () => {
    try {
      set({ loading: true, error: null });
      const datasets = await api.listDatasets();
      set({ datasets, loading: false });
    } catch (error) {
      set({ error: `Failed to load datasets: ${error}`, loading: false });
    }
  },

  createDataset: async (name: string, description?: string) => {
    try {
      set({ loading: true, error: null });
      const dataset = await api.createDataset(name, description);

      // Reload datasets and select the new one
      await get().loadDatasets();
      await get().selectDataset(dataset.id);

      set({ loading: false });
      return dataset;
    } catch (error) {
      set({ error: `Failed to create dataset: ${error}`, loading: false });
      throw error;
    }
  },

  selectDataset: async (datasetId: string) => {
    try {
      set({ loading: true, error: null, selectedDatasetId: datasetId });

      const dataset = await api.getDataset(datasetId);
      if (!dataset) {
        throw new Error('Dataset not found');
      }

      set({ currentDataset: dataset });
      await get().loadTableView(datasetId, 0);

      set({ loading: false });
    } catch (error) {
      set({ error: `Failed to select dataset: ${error}`, loading: false });
    }
  },

  deleteDataset: async (datasetId: string) => {
    try {
      set({ loading: true, error: null });
      await api.deleteDataset(datasetId);

      // Clear current dataset if it was deleted
      if (get().selectedDatasetId === datasetId) {
        set({
          currentDataset: null,
          currentTableView: null,
          selectedDatasetId: null,
        });
      }

      // Reload datasets
      await get().loadDatasets();
      set({ loading: false });
    } catch (error) {
      set({ error: `Failed to delete dataset: ${error}`, loading: false });
    }
  },

  // Table view
  loadTableView: async (datasetId: string, page?: number) => {
    try {
      set({ loading: true, error: null });

      const { rowsPerPage } = get();
      const currentPage = page !== undefined ? page : get().currentPage;
      const offset = currentPage * rowsPerPage;

      const [tableView, totalRows] = await Promise.all([
        api.getTableView(datasetId, rowsPerPage, offset),
        api.countRows(datasetId),
      ]);

      if (!tableView) {
        throw new Error('Table view not found');
      }

      set({
        currentTableView: tableView,
        currentPage,
        totalRows,
        loading: false,
      });
    } catch (error) {
      set({ error: `Failed to load table view: ${error}`, loading: false });
    }
  },

  refreshTableView: async () => {
    const { selectedDatasetId, currentPage } = get();
    if (selectedDatasetId) {
      await get().loadTableView(selectedDatasetId, currentPage);
    }
  },

  // Column management
  addColumn: async (name: string, columnType: ColumnType, prompt?: string, providerId?: string) => {
    try {
      const { currentDataset, currentTableView } = get();
      if (!currentDataset) {
        throw new Error('No dataset selected');
      }

      set({ loading: true, error: null });

      const position = currentTableView?.columns.length ?? 0;
      const column = await api.addColumn(
        currentDataset.id,
        name,
        columnType,
        prompt,
        providerId,
        position
      );

      // Refresh table view to show new column
      await get().refreshTableView();

      set({ loading: false });
      return column;
    } catch (error) {
      set({ error: `Failed to add column: ${error}`, loading: false });
      throw error;
    }
  },

  deleteColumn: async (columnId: string) => {
    try {
      set({ loading: true, error: null });
      await api.deleteColumn(columnId);

      // Refresh table view
      await get().refreshTableView();

      set({ loading: false });
    } catch (error) {
      set({ error: `Failed to delete column: ${error}`, loading: false });
    }
  },

  // Cell management
  updateCell: async (columnId: string, rowIndex: number, value: string) => {
    try {
      const { currentDataset } = get();
      if (!currentDataset) {
        throw new Error('No dataset selected');
      }

      await api.updateCell(currentDataset.id, columnId, rowIndex, value);

      // Update local state optimistically
      const { currentTableView } = get();
      if (currentTableView) {
        const updatedRows = currentTableView.rows.map((row) => {
          if (row.index === rowIndex && row.cells[columnId]) {
            return {
              ...row,
              cells: {
                ...row.cells,
                [columnId]: {
                  ...row.cells[columnId],
                  value,
                },
              },
            };
          }
          return row;
        });

        set({
          currentTableView: {
            ...currentTableView,
            rows: updatedRows,
          },
        });
      }
    } catch (error) {
      set({ error: `Failed to update cell: ${error}` });
      // Refresh to get correct state from backend
      await get().refreshTableView();
    }
  },

  // Import/Export
  importCsv: async (csvContent: string) => {
    try {
      const { currentDataset } = get();
      if (!currentDataset) {
        throw new Error('No dataset selected');
      }

      set({ loading: true, error: null });
      await api.importCsv(currentDataset.id, csvContent);

      // Refresh table view to show imported data
      await get().refreshTableView();

      set({ loading: false });
    } catch (error) {
      set({ error: `Failed to import CSV: ${error}`, loading: false });
    }
  },

  exportCsv: async () => {
    try {
      const { currentDataset } = get();
      if (!currentDataset) {
        throw new Error('No dataset selected');
      }

      set({ loading: true, error: null });
      const csv = await api.exportCsv(currentDataset.id);
      set({ loading: false });
      return csv;
    } catch (error) {
      set({ error: `Failed to export CSV: ${error}`, loading: false });
      throw error;
    }
  },

  // Pagination
  nextPage: async () => {
    const { currentPage, totalRows, rowsPerPage, selectedDatasetId } = get();
    const maxPage = Math.ceil(totalRows / rowsPerPage) - 1;

    if (currentPage < maxPage && selectedDatasetId) {
      await get().loadTableView(selectedDatasetId, currentPage + 1);
    }
  },

  previousPage: async () => {
    const { currentPage, selectedDatasetId } = get();

    if (currentPage > 0 && selectedDatasetId) {
      await get().loadTableView(selectedDatasetId, currentPage - 1);
    }
  },

  setRowsPerPage: async (rows: number) => {
    const { selectedDatasetId } = get();
    set({ rowsPerPage: rows, currentPage: 0 });

    if (selectedDatasetId) {
      await get().loadTableView(selectedDatasetId, 0);
    }
  },

  // Error handling
  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
