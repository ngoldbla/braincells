import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { Button } from '../button/button';
import { Input } from '../input/input';
import { Label } from '../label/label';
// Using a custom modal implementation for settings
import { Checkbox } from '../checkbox/checkbox';

interface Settings {
  ollama_enabled: boolean;
  ollama_endpoint: string;
  ollama_model: string;
  hf_token: string | null;
  hf_endpoint: string | null;
  embedding_provider: string;
  embedding_model: string;
}

declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: any) => Promise<any>;
    };
  }
}

export const SettingsModal = component$<{ isOpen: boolean; onClose$: () => void }>(
  ({ isOpen, onClose$ }) => {
    const settings = useSignal<Settings>({
      ollama_enabled: false,
      ollama_endpoint: 'http://localhost:11434',
      ollama_model: 'llama3.2',
      hf_token: null,
      hf_endpoint: null,
      embedding_provider: 'transformers',
      embedding_model: 'Xenova/all-MiniLM-L6-v2',
    });

    const testingOllama = useSignal(false);
    const ollamaStatus = useSignal<'untested' | 'success' | 'failed'>('untested');
    const saveStatus = useSignal<string>('');

    // Load settings when modal opens
    useVisibleTask$(async ({ track }) => {
      track(() => isOpen);
      
      if (isOpen && window.__TAURI__) {
        try {
          const loadedSettings = await window.__TAURI__.invoke('load_settings');
          settings.value = loadedSettings;
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
      }
    });

    const testOllamaConnection = $(async () => {
      if (!window.__TAURI__) return;
      
      testingOllama.value = true;
      try {
        const result = await window.__TAURI__.invoke('test_ollama_connection', {
          endpoint: settings.value.ollama_endpoint,
        });
        ollamaStatus.value = result ? 'success' : 'failed';
      } catch (error) {
        console.error('Ollama test failed:', error);
        ollamaStatus.value = 'failed';
      } finally {
        testingOllama.value = false;
      }
    });

    const saveSettings = $(async () => {
      if (!window.__TAURI__) {
        saveStatus.value = 'Running in browser - settings not saved';
        return;
      }

      try {
        await window.__TAURI__.invoke('save_settings', {
          settings: settings.value,
        });
        saveStatus.value = 'Settings saved successfully!';
        
        // Reload the page to apply new settings
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('Failed to save settings:', error);
        saveStatus.value = 'Failed to save settings';
      }
    });

    if (!isOpen) return null;

    return (
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          class="fixed inset-0 bg-black bg-opacity-50"
          onClick$={onClose$}
        />
        
        {/* Modal Content */}
        <div class="relative bg-white rounded-lg shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto z-10">
          <div class="p-6">
          <h2 class="text-2xl font-bold mb-6">Settings</h2>
          
          {/* Ollama Configuration */}
          <div class="mb-6 p-4 border rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Ollama Configuration (Local Inference)</h3>
            
            <div class="mb-4 flex items-center">
              <Checkbox
                checked={settings.value.ollama_enabled}
                onInput$={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  settings.value = { ...settings.value, ollama_enabled: target.checked };
                }}
              />
              <Label class="ml-2">Enable Ollama for local model inference</Label>
            </div>

            <div class="mb-4">
              <Label>Ollama Endpoint</Label>
              <Input
                type="text"
                value={settings.value.ollama_endpoint}
                onInput$={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  settings.value = { ...settings.value, ollama_endpoint: target.value };
                }}
                placeholder="http://localhost:11434"
                class="w-full"
              />
            </div>

            <div class="mb-4">
              <Label>Ollama Model</Label>
              <Input
                type="text"
                value={settings.value.ollama_model}
                onInput$={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  settings.value = { ...settings.value, ollama_model: target.value };
                }}
                placeholder="llama3.2"
                class="w-full"
              />
              <p class="text-sm text-gray-600 mt-1">
                Common models: llama3.2, mistral, phi, gemma2, qwen2.5
              </p>
            </div>

            <Button
              onClick$={testOllamaConnection}
              disabled={testingOllama.value}
              class="mb-2"
            >
              {testingOllama.value ? 'Testing...' : 'Test Ollama Connection'}
            </Button>
            
            {ollamaStatus.value === 'success' && (
              <p class="text-green-600 text-sm">✓ Ollama connection successful!</p>
            )}
            {ollamaStatus.value === 'failed' && (
              <p class="text-red-600 text-sm">✗ Failed to connect to Ollama. Make sure it's running.</p>
            )}

            <div class="mt-2 p-2 bg-gray-100 rounded text-sm">
              <p class="font-semibold">How to set up Ollama:</p>
              <ol class="list-decimal list-inside mt-1">
                <li>Install Ollama: <code>brew install ollama</code></li>
                <li>Start Ollama: <code>ollama serve</code></li>
                <li>Pull a model: <code>ollama pull llama3.2</code></li>
              </ol>
            </div>
          </div>

          {/* Hugging Face Configuration */}
          <div class="mb-6 p-4 border rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Hugging Face Configuration</h3>
            
            <div class="mb-4">
              <Label>Hugging Face API Token</Label>
              <Input
                type="password"
                value={settings.value.hf_token || ''}
                onInput$={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  settings.value = { ...settings.value, hf_token: target.value || null };
                }}
                placeholder="hf_..."
                class="w-full"
              />
              <p class="text-sm text-gray-600 mt-1">
                Get your token from{' '}
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  class="text-blue-600 underline"
                >
                  Hugging Face Settings
                </a>
              </p>
            </div>

            <div class="mb-4">
              <Label>Custom HF Endpoint (Optional)</Label>
              <Input
                type="text"
                value={settings.value.hf_endpoint || ''}
                onInput$={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  settings.value = { ...settings.value, hf_endpoint: target.value || null };
                }}
                placeholder="Leave blank for default"
                class="w-full"
              />
            </div>
          </div>

          {/* Embedding Configuration */}
          <div class="mb-6 p-4 border rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Embedding Configuration</h3>
            
            <div class="mb-4">
              <Label>Embedding Provider</Label>
              <select
                value={settings.value.embedding_provider}
                onChange$={(e: Event) => {
                  const target = e.target as HTMLSelectElement;
                  settings.value = { ...settings.value, embedding_provider: target.value };
                }}
                class="w-full p-2 border rounded"
              >
                <option value="transformers">Local Transformers</option>
                <option value="ollama">Ollama</option>
                <option value="huggingface">Hugging Face API</option>
              </select>
            </div>

            <div class="mb-4">
              <Label>Embedding Model</Label>
              <Input
                type="text"
                value={settings.value.embedding_model}
                onInput$={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  settings.value = { ...settings.value, embedding_model: target.value };
                }}
                placeholder="Xenova/all-MiniLM-L6-v2"
                class="w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div class="flex justify-between items-center">
            <div class="text-sm">
              {saveStatus.value && (
                <span
                  class={
                    saveStatus.value.includes('success')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {saveStatus.value}
                </span>
              )}
            </div>
            <div class="flex gap-2">
              <Button onClick$={onClose$} class="border border-gray-300">
                Cancel
              </Button>
              <Button onClick$={saveSettings}>Save Settings</Button>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  }
);