import OpenAI from 'openai';

export async function transcribeAudio(
  client: OpenAI,
  audioBuffer: ArrayBuffer,
  model = 'whisper-1',
): Promise<{ value?: string; error?: string }> {
  try {
    const file = new File([audioBuffer], 'audio.webm', {
      type: 'audio/webm',
    });

    const response = await client.audio.transcriptions.create({
      model,
      file,
    });

    return { value: response.text };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
