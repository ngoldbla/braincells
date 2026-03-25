import OpenAI from 'openai';

export async function analyzeImage(
  client: OpenAI,
  imageUrl: string,
  prompt: string,
  model = 'gpt-4o',
): Promise<{ value?: string; error?: string }> {
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return { value: content || '' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
