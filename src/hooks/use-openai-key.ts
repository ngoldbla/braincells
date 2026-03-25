'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'openai-api-key';

export function useOpenAIKey() {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKeyState(stored);
    setIsLoaded(true);
  }, []);

  const setApiKey = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKeyState('');
  }, []);

  return { apiKey, setApiKey, clearApiKey, isLoaded, hasKey: !!apiKey };
}
