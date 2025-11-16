import { useSetupStore } from '../../stores/setup-store';

export function WelcomeStep() {
  const { nextStep } = useSetupStore();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Brain Cells
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        AI-Powered Spreadsheet Automation
      </p>

      <div className="my-12">
        <div className="inline-flex items-center justify-center w-32 h-32 bg-indigo-100 rounded-full mb-6">
          <svg
            className="w-16 h-16 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
          Let's get started by setting up your AI provider. You can choose
          between cloud-based services or run models locally on your machine.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto mb-12">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-900 mb-2">
              ☁️ Cloud Providers
            </div>
            <p className="text-sm text-blue-700">
              Use OpenAI, Anthropic, or custom APIs for powerful cloud-based AI
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-900 mb-2">
              💻 Local AI
            </div>
            <p className="text-sm text-green-700">
              Run models locally with Ollama for privacy and offline access
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-900 mb-2">
              🔄 Flexible
            </div>
            <p className="text-sm text-purple-700">
              Switch between providers anytime or use multiple at once
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={nextStep}
        className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
      >
        Get Started
      </button>
    </div>
  );
}
