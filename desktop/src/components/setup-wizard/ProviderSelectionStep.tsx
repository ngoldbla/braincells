import { useSetupStore } from '../../stores/setup-store';
import { ProviderType } from '../../types/provider';

const providerOptions = [
  {
    type: ProviderType.CloudOpenAI,
    title: 'OpenAI',
    description: 'Use GPT-4, GPT-3.5, and other OpenAI models',
    icon: '🤖',
    popular: true,
  },
  {
    type: ProviderType.CloudAnthropic,
    title: 'Anthropic Claude',
    description: 'Use Claude 3.5 Sonnet, Opus, and Haiku models',
    icon: '🧠',
    popular: true,
  },
  {
    type: ProviderType.LocalOllama,
    title: 'Local AI (Ollama)',
    description: 'Run models locally for privacy and offline access',
    icon: '💻',
    popular: true,
  },
  {
    type: ProviderType.CloudCustom,
    title: 'Custom OpenAI-Compatible API',
    description: 'Connect to any OpenAI-compatible endpoint',
    icon: '⚙️',
    popular: false,
  },
];

export function ProviderSelectionStep() {
  const { nextStep, previousStep, setSelectedProviderType } = useSetupStore();

  const handleSelect = (type: ProviderType) => {
    setSelectedProviderType(type);
    nextStep();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        Choose Your AI Provider
      </h2>
      <p className="text-gray-600 mb-8 text-center">
        Select how you'd like to power your AI automations
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {providerOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => handleSelect(option.type)}
            className="relative p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all text-left group"
          >
            {option.popular && (
              <span className="absolute top-3 right-3 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                Popular
              </span>
            )}
            <div className="text-4xl mb-3">{option.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {option.title}
            </h3>
            <p className="text-sm text-gray-600">{option.description}</p>
            <div className="mt-4 flex items-center text-indigo-600 group-hover:text-indigo-700 font-medium">
              Select
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={previousStep}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
