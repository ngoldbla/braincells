import OpenAI from 'openai';

export async function generateText(
  client: OpenAI,
  prompt: string,
  model = 'gpt-4o-mini',
): Promise<{ value?: string; error?: string }> {
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

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
  const stream = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  let accumulated = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    accumulated += delta;
    yield { value: accumulated, done: false };
  }
  yield { value: accumulated, done: true };
}
