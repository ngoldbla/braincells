import { create } from 'zustand';

export type CellPosition = { columnId: string; rowIdx: number } | null;

interface UIState {
  sidebarOpen: boolean;
  selectedColumnId: string | null;
  isGenerating: boolean;
  generatingColumnId: string | null;
  focusedCell: CellPosition;
  editingCell: CellPosition;

  setSidebarOpen: (open: boolean) => void;
  setSelectedColumnId: (id: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setGeneratingColumnId: (id: string | null) => void;
  setFocusedCell: (cell: CellPosition) => void;
  setEditingCell: (cell: CellPosition) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  selectedColumnId: null,
  isGenerating: false,
  generatingColumnId: null,
  focusedCell: null,
  editingCell: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedColumnId: (id) => set({ selectedColumnId: id, sidebarOpen: !!id }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setGeneratingColumnId: (id) => set({ generatingColumnId: id }),
  setFocusedCell: (cell) => set({ focusedCell: cell }),
  setEditingCell: (cell) => set({ editingCell: cell }),
}));
