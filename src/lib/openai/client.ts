import OpenAI from 'openai';

export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}
