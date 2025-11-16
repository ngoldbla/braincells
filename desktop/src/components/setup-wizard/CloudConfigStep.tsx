import { useState } from 'react';
import { useSetupStore } from '../../stores/setup-store';
import { useProviderStore } from '../../stores/provider-store';
import { testCloudConnection } from '../../lib/tauri-api';
import { ProviderType } from '../../types/provider';

// Type guard to ensure only cloud provider types are used
type CloudProviderType =
  | ProviderType.CloudOpenAI
  | ProviderType.CloudAnthropic
  | ProviderType.CloudCustom;

const DEFAULT_BASE_URLS: Record<CloudProviderType, string> = {
  [ProviderType.CloudOpenAI]: 'https://api.openai.com/v1',
  [ProviderType.CloudAnthropic]: 'https://api.anthropic.com/v1',
  [ProviderType.CloudCustom]: '',
};

const DEFAULT_MODELS: Record<CloudProviderType, string> = {
  [ProviderType.CloudOpenAI]: 'gpt-4',
  [ProviderType.CloudAnthropic]: 'claude-3-5-sonnet-20241022',
  [ProviderType.CloudCustom]: '',
};

function isCloudProvider(type: ProviderType | null): type is CloudProviderType {
  return type === ProviderType.CloudOpenAI ||
         type === ProviderType.CloudAnthropic ||
         type === ProviderType.CloudCustom;
}

export function CloudConfigStep() {
  const { selectedProviderType, nextStep, previousStep } = useSetupStore();
  const { addProvider } = useProviderStore();

  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(
    isCloudProvider(selectedProviderType) ? DEFAULT_BASE_URLS[selectedProviderType] : ''
  );
  const [modelName, setModelName] = useState(
    isCloudProvider(selectedProviderType) ? DEFAULT_MODELS[selectedProviderType] : ''
  );
  const [providerName, setProviderName] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    if (!selectedProviderType) return;

    setTesting(true);
    setTestResult(null);

    try {
      const success = await testCloudConnection(
        apiKey,
        baseUrl,
        modelName,
        selectedProviderType
      );

      setTestResult({
        success,
        message: success
          ? 'Connection successful!'
          : 'Connection failed. Please check your credentials.',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!selectedProviderType) return;

    const provider = {
      id: `provider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name:
        providerName ||
        `${selectedProviderType.replace('cloud_', '').toUpperCase()} Provider`,
      provider_type: selectedProviderType,
      credentials: {
        api_key: apiKey,
        base_url: baseUrl,
        model_name: modelName,
      },
      is_default: true,
    };

    addProvider(provider);
    nextStep();
  };

  const isFormValid =
    apiKey.trim() !== '' &&
    baseUrl.trim() !== '' &&
    modelName.trim() !== '' &&
    testResult?.success;

  const getProviderTitle = () => {
    switch (selectedProviderType) {
      case ProviderType.CloudOpenAI:
        return 'OpenAI Configuration';
      case ProviderType.CloudAnthropic:
        return 'Anthropic Claude Configuration';
      case ProviderType.CloudCustom:
        return 'Custom API Configuration';
      default:
        return 'Provider Configuration';
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        {getProviderTitle()}
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Enter your API credentials to connect
      </p>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider Name (Optional)
          </label>
          <input
            type="text"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder={`My ${selectedProviderType?.replace('cloud_', '').toUpperCase()} Provider`}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key *
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base URL *
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com/v1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Name *
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="gpt-4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleTest}
          disabled={
            testing || !apiKey || !baseUrl || !modelName
          }
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {testing ? 'Testing Connection...' : 'Test Connection'}
        </button>

        {testResult && (
          <div
            className={`p-4 rounded-lg ${
              testResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {testResult.message}
          </div>
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
          disabled={!isFormValid}
          className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
