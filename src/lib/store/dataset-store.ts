import { create } from 'zustand';
import type { Column, Cell, Dataset, Process } from '@/lib/types/domain';

interface DatasetState {
  datasets: Dataset[];
  activeDataset: Dataset | null;
  columns: Column[];
  rowCount: number;

  setDatasets: (datasets: Dataset[]) => void;
  setActiveDataset: (dataset: Dataset | null) => void;
  setColumns: (columns: Column[]) => void;
  setRowCount: (count: number) => void;

  addColumn: (column: Column) => void;
  removeColumn: (columnId: string) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  updateColumnProcess: (columnId: string, process: Process) => void;

  updateCell: (columnId: string, cell: Cell) => void;
  setCellsForColumn: (columnId: string, cells: Cell[]) => void;
  mergeCells: (columnId: string, cells: Cell[]) => void;
}

export const useDatasetStore = create<DatasetState>((set) => ({
  datasets: [],
  activeDataset: null,
  columns: [],
  rowCount: 0,

  setDatasets: (datasets) => set({ datasets }),
  setActiveDataset: (dataset) => set({ activeDataset: dataset }),
  setColumns: (columns) => set({ columns }),
  setRowCount: (count) => set({ rowCount: count }),

  addColumn: (column) =>
    set((state) => ({ columns: [...state.columns, column] })),

  removeColumn: (columnId) =>
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== columnId),
    })),

  updateColumn: (columnId, updates) =>
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, ...updates } : c,
      ),
    })),

  updateColumnProcess: (columnId, process) =>
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, process } : c,
      ),
    })),

  updateCell: (columnId, cell) =>
    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id !== columnId) return col;
        const existing = col.cells.findIndex(
          (c) => c.row_idx === cell.row_idx,
        );
        const newCells =
          existing >= 0
            ? col.cells.map((c) => (c.row_idx === cell.row_idx ? cell : c))
            : [...col.cells, cell].sort((a, b) => a.row_idx - b.row_idx);
        return { ...col, cells: newCells };
      }),
    })),

  setCellsForColumn: (columnId, cells) =>
    set((state) => ({
      columns: state.columns.map((col) =>
        col.id === columnId ? { ...col, cells } : col,
      ),
    })),

  mergeCells: (columnId, newCells) =>
    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id !== columnId) return col;
        const cellMap = new Map(col.cells.map((c) => [c.row_idx, c]));
        for (const cell of newCells) {
          cellMap.set(cell.row_idx, cell);
        }
        return {
          ...col,
          cells: Array.from(cellMap.values()).sort(
            (a, b) => a.row_idx - b.row_idx,
          ),
        };
      }),
    })),
}));
