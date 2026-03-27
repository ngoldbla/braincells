'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useOpenAIKey } from '@/hooks/use-openai-key';
import type { Provider } from '@/lib/types/domain';

const PROVIDERS: { value: Provider; label: string; description: string; placeholder: string }[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, GPT-4.1, o4-mini, and more',
    placeholder: 'sk-...',
  },
  {
    value: 'mercury',
    label: 'Mercury (Inception Labs)',
    description: 'Diffusion-based LLM — 5-10x faster, $0.25/M input tokens',
    placeholder: 'sk_...',
  },
];

export default function SettingsPage() {
  const { provider, setProvider, apiKey, setApiKey, clearApiKey, isLoaded, hasKey } =
    useOpenAIKey();
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    if (isLoaded && apiKey) {
      setKeyInput(apiKey.slice(0, 7) + '...' + apiKey.slice(-4));
    }
  }, [isLoaded, apiKey]);

  const handleSave = () => {
    if (!keyInput.trim() || keyInput.includes('...')) {
      toast.error('Enter a valid API key');
      return;
    }
    setApiKey(keyInput.trim());
    toast.success('API key saved');
    setKeyInput(keyInput.trim().slice(0, 7) + '...' + keyInput.trim().slice(-4));
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput('');
    toast.success('API key removed');
  };

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    // Clear key input when switching providers since keys differ
    if (apiKey) {
      clearApiKey();
      setKeyInput('');
    }
  };

  const currentProvider = PROVIDERS.find((p) => p.value === provider)!;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Settings</h1>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">AI Provider</CardTitle>
          <CardDescription className="text-zinc-500">
            Choose which AI provider to use for generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              onClick={() => handleProviderChange(p.value)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                provider === p.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    provider === p.value ? 'bg-blue-500' : 'bg-zinc-600'
                  }`}
                />
                <span className="text-sm font-medium text-zinc-100">
                  {p.label}
                </span>
              </div>
              <p className="mt-1 ml-4 text-xs text-zinc-500">{p.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Separator className="my-6 bg-zinc-800" />

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">
            {currentProvider.label} API Key
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Your API key is stored locally in your browser and sent with each
            request. It is never stored on our servers.
            {provider === 'mercury' && (
              <span className="block mt-1 text-zinc-600">
                Base URL: https://api.inceptionlabs.ai/v1
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={currentProvider.placeholder}
              className="border-zinc-700 bg-zinc-800 text-zinc-100 font-mono text-sm"
              onFocus={() => {
                if (keyInput.includes('...')) setKeyInput('');
              }}
            />
            <Button onClick={handleSave}>Save</Button>
            {hasKey && (
              <Button variant="ghost" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                hasKey ? 'bg-green-500' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs text-zinc-500">
              {hasKey ? 'API key configured' : 'No API key set'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6 bg-zinc-800" />

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">
            About braincells
          </CardTitle>
          <CardDescription className="text-zinc-500">
            braincells is a spreadsheet where columns can be AI-generated.
            Reference data between columns using {'{{column_name}}'} syntax
            in your prompts to create powerful data pipelines. Supports OpenAI
            and Mercury (Inception Labs) models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-300">Text Generation</strong> —
              Generate text using GPT or Mercury models
            </p>
            <p>
              <strong className="text-zinc-300">Image Generation</strong> —
              Create images from text descriptions (OpenAI only)
            </p>
            <p>
              <strong className="text-zinc-300">Vision</strong> — Analyze
              images and generate text descriptions (OpenAI only)
            </p>
            <p>
              <strong className="text-zinc-300">Speech</strong> — Convert
              text to audio (OpenAI only)
            </p>
            <p>
              <strong className="text-zinc-300">Transcription</strong> —
              Convert audio to text (OpenAI only)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
