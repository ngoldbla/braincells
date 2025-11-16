import { useEffect, useState } from 'react';
import { SetupWizard } from './components/setup-wizard/SetupWizard';
import { Spreadsheet } from './components/spreadsheet';
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

  return <Spreadsheet />;
}

export default App;
