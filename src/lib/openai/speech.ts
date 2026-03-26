import OpenAI from 'openai';

export type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export async function generateSpeech(
  client: OpenAI,
  text: string,
  voice: Voice = 'alloy',
  model: 'tts-1' | 'tts-1-hd' = 'tts-1',
): Promise<{ value?: ArrayBuffer; error?: string }> {
  try {
    const response = await client.audio.speech.create({
      model,
      voice,
      input: text,
    });

    const buffer = await response.arrayBuffer();
    return { value: buffer };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
