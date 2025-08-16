import { component$ } from '@builder.io/qwik';
import { useTauri } from '~/hooks/use-tauri';

export const TauriStatus = component$(() => {
  const { isTauri, systemInfo } = useTauri();

  return (
    <div class="fixed bottom-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg text-xs">
      {isTauri.value ? (
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Running in Tauri</span>
          </div>
          {systemInfo.value && (
            <div class="text-gray-600 dark:text-gray-400">
              <div>Platform: {systemInfo.value.platform}</div>
              <div>Arch: {systemInfo.value.arch}</div>
              <div>Version: {systemInfo.value.version}</div>
            </div>
          )}
        </div>
      ) : (
        <div class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span>Running in Browser</span>
        </div>
      )}
    </div>
  );
});