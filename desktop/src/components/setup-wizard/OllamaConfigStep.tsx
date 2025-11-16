import { useState, useEffect } from 'react';
import { useSetupStore } from '../../stores/setup-store';
import { useProviderStore } from '../../stores/provider-store';
import {
  isOllamaInstalled,
  getOllamaVersion,
  installOllama,
  checkOllamaStatus,
  startOllama,
  pullOllamaModel,
  checkSystemRequirements,
} from '../../lib/tauri-api';
import type { SystemRequirements, ProviderStatus } from '../../types/provider';
import { LocalRuntime, ProviderType } from '../../types/provider';

export function OllamaConfigStep() {
  const { nextStep, previousStep } = useSetupStore();
  const { addProvider } = useProviderStore();

  const [installed, setInstalled] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [sysReq, setSysReq] = useState<SystemRequirements | null>(null);
  const [installing, setInstalling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [pullingModel, setPullingModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama3.3');
  const [port, setPort] = useState(11434);
  const [gpuEnabled, setGpuEnabled] = useState(true);

  useEffect(() => {
    checkInstallation();
    checkRequirements();
  }, []);

  const checkInstallation = async () => {
    const isInstalled = await isOllamaInstalled();
    setInstalled(isInstalled);

    if (isInstalled) {
      const ver = await getOllamaVersion();
      setVersion(ver);

      const currentStatus = await checkOllamaStatus();
      setStatus(currentStatus);
    }
  };

  const checkRequirements = async () => {
    const req = await checkSystemRequirements();
    setSysReq(req);
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await installOllama();
      await checkInstallation();
    } catch (error) {
      alert(`Failed to install Ollama: ${error}`);
    } finally {
      setInstalling(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await startOllama(port, gpuEnabled);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await checkInstallation();
    } catch (error) {
      alert(`Failed to start Ollama: ${error}`);
    } finally {
      setStarting(false);
    }
  };

  const handlePullModel = async () => {
    setPullingModel(true);
    try {
      await pullOllamaModel(selectedModel, port);
    } catch (error) {
      alert(`Failed to pull model: ${error}`);
    } finally {
      setPullingModel(false);
    }
  };

  const handleSave = () => {
    const provider = {
      id: `provider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Local Ollama',
      provider_type: ProviderType.LocalOllama,
      local_config: {
        runtime: LocalRuntime.Ollama,
        model_path: selectedModel,
        port,
        gpu_enabled: gpuEnabled,
      },
      is_default: true,
    };

    addProvider(provider);
    nextStep();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        Local AI with Ollama
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Run AI models locally for privacy and offline access
      </p>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* System Requirements */}
        {sysReq && (
          <div
            className={`p-4 rounded-lg ${
              sysReq.meets_requirements
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <h3 className="font-semibold mb-2">System Requirements</h3>
            <div className="text-sm space-y-1">
              <p>
                Memory: {sysReq.total_memory_gb.toFixed(1)} GB (
                {sysReq.available_memory_gb.toFixed(1)} GB available)
              </p>
              <p>Disk Space: {sysReq.disk_space_gb.toFixed(1)} GB</p>
              <p>
                GPU: {sysReq.has_gpu ? `Yes (${sysReq.gpu_name})` : 'No'}
              </p>
              {!sysReq.meets_requirements && (
                <p className="text-yellow-700 font-medium mt-2">
                  ⚠️ Your system may struggle with larger models. Consider
                  using cloud providers instead.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Installation Status */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Ollama Installation</h3>
              <p className="text-sm text-gray-600">
                {installed
                  ? `Installed (${version})`
                  : 'Not installed'}
              </p>
            </div>
            {!installed && (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {installing ? 'Installing...' : 'Install Ollama'}
              </button>
            )}
          </div>

          {status && (
            <div className="text-sm">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  status.is_running ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {status.message}
            </div>
          )}
        </div>

        {installed && (
          <>
            {/* Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={gpuEnabled}
                  onChange={(e) => setGpuEnabled(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Enable GPU acceleration{' '}
                  {sysReq?.has_gpu ? '(Available)' : '(Not available)'}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="llama3.3">Llama 3.3 (Latest)</option>
                  <option value="llama3.2">Llama 3.2</option>
                  <option value="qwen2.5:3b">Qwen 2.5 3B (Small)</option>
                  <option value="phi4">Phi 4</option>
                  <option value="mistral">Mistral</option>
                </select>
              </div>
            </div>

            {!status?.is_running && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {starting ? 'Starting Ollama...' : 'Start Ollama'}
              </button>
            )}

            {status?.is_running && (
              <button
                onClick={handlePullModel}
                disabled={pullingModel}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {pullingModel
                  ? 'Downloading Model...'
                  : `Download ${selectedModel}`}
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={previousStep}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSave}
          disabled={!installed || !status?.is_running}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
