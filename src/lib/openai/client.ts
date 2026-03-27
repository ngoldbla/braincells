import OpenAI from 'openai';

export function createOpenAIClient(apiKey: string, baseURL?: string): OpenAI {
  return new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
}
