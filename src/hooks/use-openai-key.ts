'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Provider } from '@/lib/types/domain';
import { MERCURY_BASE_URL } from '@/lib/types/domain';

const PROVIDER_KEY = 'ai-provider';
const API_KEY_KEY = 'ai-api-key';
const LEGACY_KEY = 'openai-api-key';

export function useOpenAIKey() {
  const [provider, setProviderState] = useState<Provider>('openai');
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Migrate from legacy storage
    const legacyKey = localStorage.getItem(LEGACY_KEY);
    const storedProvider = localStorage.getItem(PROVIDER_KEY) as Provider | null;
    const storedKey = localStorage.getItem(API_KEY_KEY);

    if (legacyKey && !storedKey) {
      // Migrate: move legacy key to new storage
      localStorage.setItem(API_KEY_KEY, legacyKey);
      localStorage.setItem(PROVIDER_KEY, 'openai');
      localStorage.removeItem(LEGACY_KEY);
      setProviderState('openai');
      setApiKeyState(legacyKey);
    } else {
      if (storedProvider) setProviderState(storedProvider);
      if (storedKey) setApiKeyState(storedKey);
    }
    setIsLoaded(true);
  }, []);

  const setProvider = useCallback((p: Provider) => {
    localStorage.setItem(PROVIDER_KEY, p);
    setProviderState(p);
  }, []);

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(API_KEY_KEY, key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_KEY);
    setApiKeyState('');
  }, []);

  const baseURL = provider === 'mercury' ? MERCURY_BASE_URL : undefined;

  return {
    provider,
    setProvider,
    apiKey,
    setApiKey,
    clearApiKey,
    isLoaded,
    hasKey: !!apiKey,
    baseURL,
  };
}
