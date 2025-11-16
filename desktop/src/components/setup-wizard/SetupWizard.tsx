import { useSetupStore } from '../../stores/setup-store';
import { WelcomeStep } from './WelcomeStep';
import { ProviderSelectionStep } from './ProviderSelectionStep';
import { CloudConfigStep } from './CloudConfigStep';
import { OllamaConfigStep } from './OllamaConfigStep';
import { CompletionStep } from './CompletionStep';
import { ProviderType } from '../../types/provider';

export function SetupWizard() {
  const { currentStep, selectedProviderType, setHasCompletedSetup } = useSetupStore();

  const handleComplete = () => {
    setHasCompletedSetup(true);
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <ProviderSelectionStep />;
      case 2:
        if (
          selectedProviderType === ProviderType.CloudOpenAI ||
          selectedProviderType === ProviderType.CloudAnthropic ||
          selectedProviderType === ProviderType.CloudCustom
        ) {
          return <CloudConfigStep />;
        } else if (selectedProviderType === ProviderType.LocalOllama) {
          return <OllamaConfigStep />;
        }
        return <ProviderSelectionStep />;
      case 3:
        return <CompletionStep onComplete={handleComplete} />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 md:p-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  step <= currentStep
                    ? 'bg-indigo-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {currentStep + 1} of 4
          </p>
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">{getStepComponent()}</div>
      </div>
    </div>
  );
}
