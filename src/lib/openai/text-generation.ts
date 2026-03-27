import OpenAI from 'openai';
import type { ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';

export async function generateText(
  client: OpenAI,
  prompt: string,
  model = 'gpt-4o-mini',
): Promise<{ value?: string; error?: string }> {
  try {
    const params: ChatCompletionCreateParamsNonStreaming = {
      model,
      messages: [{ role: 'user', content: prompt }],
      ...(model.startsWith('mercury') && { realtime: true } as any),
    };
    const response = await client.chat.completions.create(params);

    const content = response.choices[0]?.message?.content;
    return { value: content || '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function* streamText(
  client: OpenAI,
  prompt: string,
  model = 'gpt-4o-mini',
): AsyncGenerator<{ value: string; done: boolean }> {
  const params: ChatCompletionCreateParamsStreaming = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    ...(model.startsWith('mercury') && { realtime: true } as any),
  };
  const stream = await client.chat.completions.create(params);

  let accumulated = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    accumulated += delta;
    yield { value: accumulated, done: false };
  }
  yield { value: accumulated, done: true };
}
