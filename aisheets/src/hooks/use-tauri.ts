import { $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';

interface TauriAPI {
  invoke: (cmd: string, args?: any) => Promise<any>;
}

declare global {
  interface Window {
    __TAURI__?: TauriAPI;
  }
}

export const useTauri = () => {
  const isTauri = useSignal(false);
  const systemInfo = useSignal<any>(null);

  useVisibleTask$(() => {
    // Check if we're running in Tauri
    if (typeof window !== 'undefined' && window.__TAURI__) {
      isTauri.value = true;
      
      // Get system info on mount
      getSystemInfo();
    }
  });

  const getSystemInfo = $(async () => {
    if (window.__TAURI__) {
      try {
        const info = await window.__TAURI__.invoke('get_system_info');
        systemInfo.value = info;
      } catch (error) {
        console.error('Failed to get system info:', error);
      }
    }
  });

  const greet = $(async (name: string) => {
    if (window.__TAURI__) {
      try {
        const message = await window.__TAURI__.invoke('greet', { name });
        return message;
      } catch (error) {
        console.error('Failed to invoke greet:', error);
        return null;
      }
    }
    return null;
  });

  return {
    isTauri: isTauri as Readonly<Signal<boolean>>,
    systemInfo: systemInfo as Readonly<Signal<any>>,
    greet,
    getSystemInfo,
  };
};