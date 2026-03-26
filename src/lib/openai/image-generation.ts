import OpenAI from 'openai';

export async function generateImage(
  client: OpenAI,
  prompt: string,
  model = 'gpt-image-1',
): Promise<{ value?: string; error?: string }> {
  try {
    const response = await client.images.generate({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = response.data?.[0]?.url;
    const b64 = response.data?.[0]?.b64_json;

    if (b64) {
      return { value: `data:image/png;base64,${b64}` };
    }

    return { value: imageUrl || '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
