import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProviderConfig } from '../types/provider';

interface ProviderStore {
  providers: ProviderConfig[];
  currentProviderId: string | null;

  addProvider: (provider: ProviderConfig) => void;
  removeProvider: (id: string) => void;
  updateProvider: (id: string, updates: Partial<ProviderConfig>) => void;
  setCurrentProvider: (id: string) => void;
  getCurrentProvider: () => ProviderConfig | null;
  getDefaultProvider: () => ProviderConfig | null;
  setDefaultProvider: (id: string) => void;
}

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set, get) => ({
      providers: [],
      currentProviderId: null,

      addProvider: (provider) =>
        set((state) => ({
          providers: [...state.providers, provider],
          currentProviderId: state.currentProviderId || provider.id,
        })),

      removeProvider: (id) =>
        set((state) => ({
          providers: state.providers.filter((p) => p.id !== id),
          currentProviderId:
            state.currentProviderId === id
              ? state.providers[0]?.id || null
              : state.currentProviderId,
        })),

      updateProvider: (id, updates) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      setCurrentProvider: (id) =>
        set({ currentProviderId: id }),

      getCurrentProvider: () => {
        const state = get();
        return (
          state.providers.find((p) => p.id === state.currentProviderId) || null
        );
      },

      getDefaultProvider: () => {
        const state = get();
        return state.providers.find((p) => p.is_default) || state.providers[0] || null;
      },

      setDefaultProvider: (id) =>
        set((state) => ({
          providers: state.providers.map((p) => ({
            ...p,
            is_default: p.id === id,
          })),
        })),
    }),
    {
      name: 'braincells-providers',
    }
  )
);
