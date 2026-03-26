import OpenAI from 'openai';

export async function embedTexts(
  client: OpenAI,
  texts: string[],
  model = 'text-embedding-3-small',
): Promise<number[][]> {
  const response = await client.embeddings.create({
    model,
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

export async function embedText(
  client: OpenAI,
  text: string,
  model = 'text-embedding-3-small',
): Promise<number[]> {
  const embeddings = await embedTexts(client, [text], model);
  return embeddings[0];
}
