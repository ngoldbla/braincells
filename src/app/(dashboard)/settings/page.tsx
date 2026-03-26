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

export default function SettingsPage() {
  const { apiKey, setApiKey, clearApiKey, isLoaded, hasKey } = useOpenAIKey();
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    if (isLoaded && apiKey) {
      // Show masked key
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Settings</h1>

      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">
            OpenAI API Key
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Your API key is stored locally in your browser and sent with each
            request. It is never stored on our servers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-..."
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
            in your prompts to create powerful data pipelines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-300">Text Generation</strong> —
              Generate text using GPT models
            </p>
            <p>
              <strong className="text-zinc-300">Image Generation</strong> —
              Create images from text descriptions
            </p>
            <p>
              <strong className="text-zinc-300">Vision</strong> — Analyze
              images and generate text descriptions
            </p>
            <p>
              <strong className="text-zinc-300">Speech</strong> — Convert
              text to audio
            </p>
            <p>
              <strong className="text-zinc-300">Transcription</strong> —
              Convert audio to text
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
