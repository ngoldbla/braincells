import { create } from 'zustand';
import type { ProviderType } from '../types/provider';

interface SetupStore {
  hasCompletedSetup: boolean;
  currentStep: number;
  selectedProviderType: ProviderType | null;

  setHasCompletedSetup: (completed: boolean) => void;
  setCurrentStep: (step: number) => void;
  setSelectedProviderType: (type: ProviderType | null) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetSetup: () => void;
}

export const useSetupStore = create<SetupStore>((set) => ({
  hasCompletedSetup: false,
  currentStep: 0,
  selectedProviderType: null,

  setHasCompletedSetup: (completed) =>
    set({ hasCompletedSetup: completed }),

  setCurrentStep: (step) =>
    set({ currentStep: step }),

  setSelectedProviderType: (type) =>
    set({ selectedProviderType: type }),

  nextStep: () =>
    set((state) => ({ currentStep: state.currentStep + 1 })),

  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),

  resetSetup: () =>
    set({
      hasCompletedSetup: false,
      currentStep: 0,
      selectedProviderType: null,
    }),
}));
