import { useEffect, useState } from 'react';
import { SetupWizard } from './components/setup-wizard/SetupWizard';
import { useProviderStore } from './stores/provider-store';
import { useSetupStore } from './stores/setup-store';

function App() {
  const { providers } = useProviderStore();
  const { hasCompletedSetup, setHasCompletedSetup } = useSetupStore();
  const [showSetup, setShowSetup] = useState(true);

  useEffect(() => {
    // Check if user has configured any providers
    if (providers.length > 0) {
      setHasCompletedSetup(true);
      setShowSetup(false);
    } else {
      setShowSetup(true);
    }
  }, [providers, setHasCompletedSetup]);

  if (showSetup || !hasCompletedSetup) {
    return <SetupWizard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Application */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Brain Cells
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Spreadsheet Automation
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              🎉 Setup Complete!
            </h2>
            <p className="text-blue-700">
              Your provider is configured. The spreadsheet interface will be
              integrated here.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Smart Spreadsheets
              </h3>
              <p className="text-sm text-gray-600">
                Create and manage spreadsheets with AI-powered formulas and
                automation
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                AI Automation
              </h3>
              <p className="text-sm text-gray-600">
                Use natural language to transform and analyze your data
                automatically
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Fast & Local
              </h3>
              <p className="text-sm text-gray-600">
                Run entirely on your machine with local AI or use cloud
                providers
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Next Steps:</strong> The existing spreadsheet
              functionality from the Docker version will be migrated here. This
              is the foundation of the new Tauri-based desktop application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
