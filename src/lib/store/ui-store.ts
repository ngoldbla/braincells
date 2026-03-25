import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  selectedColumnId: string | null;
  isGenerating: boolean;
  generatingColumnId: string | null;

  setSidebarOpen: (open: boolean) => void;
  setSelectedColumnId: (id: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setGeneratingColumnId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  selectedColumnId: null,
  isGenerating: false,
  generatingColumnId: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedColumnId: (id) => set({ selectedColumnId: id, sidebarOpen: !!id }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setGeneratingColumnId: (id) => set({ generatingColumnId: id }),
}));
