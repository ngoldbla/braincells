import { useProviderStore } from '../../stores/provider-store';

interface CompletionStepProps {
  onComplete: () => void;
}

export function CompletionStep({ onComplete }: CompletionStepProps) {
  const { getCurrentProvider } = useProviderStore();
  const provider = getCurrentProvider();

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
        <svg
          className="w-12 h-12 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Setup Complete!
      </h2>
      <p className="text-xl text-gray-600 mb-8">
        You're all set to start using Brain Cells
      </p>

      {provider && (
        <div className="max-w-md mx-auto mb-12 p-6 bg-blue-50 rounded-lg text-left">
          <h3 className="font-semibold text-blue-900 mb-3">
            Active Provider
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-blue-700">Name:</span>{' '}
              <span className="font-medium">{provider.name}</span>
            </p>
            <p>
              <span className="text-blue-700">Type:</span>{' '}
              <span className="font-medium">
                {provider.provider_type.replace('_', ' ').toUpperCase()}
              </span>
            </p>
            {provider.credentials && (
              <p>
                <span className="text-blue-700">Model:</span>{' '}
                <span className="font-medium">
                  {provider.credentials.model_name}
                </span>
              </p>
            )}
            {provider.local_config && (
              <>
                <p>
                  <span className="text-blue-700">Model:</span>{' '}
                  <span className="font-medium">
                    {provider.local_config.model_path}
                  </span>
                </p>
                <p>
                  <span className="text-blue-700">Port:</span>{' '}
                  <span className="font-medium">
                    {provider.local_config.port}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium mb-1">📊 Create Spreadsheets</div>
            <p className="text-gray-600">
              Start automating data with AI-powered formulas
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium mb-1">🔄 Switch Providers</div>
            <p className="text-gray-600">
              Add more providers in settings anytime
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium mb-1">⚡ Automate Tasks</div>
            <p className="text-gray-600">
              Use natural language to transform your data
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="px-12 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
      >
        Start Using Brain Cells
      </button>
    </div>
  );
}
