import OpenAI from 'openai';

interface WebSearchResult {
  value?: string;
  error?: string;
  sources?: Array<{ url: string; snippet: string }>;
}

export async function searchWeb(
  client: OpenAI,
  query: string,
  model = 'gpt-4o-mini',
): Promise<WebSearchResult> {
  try {
    // Use the OpenAI Responses API with web_search tool
    const response = await (client as any).responses.create({
      model,
      tools: [{ type: 'web_search' as any }],
      input: query,
    });

    // Extract text output and sources
    let text = '';
    const sources: Array<{ url: string; snippet: string }> = [];

    for (const item of response.output || []) {
      if (item.type === 'message') {
        for (const content of item.content || []) {
          if (content.type === 'output_text') {
            text += content.text;
            // Extract annotations as sources
            for (const annotation of content.annotations || []) {
              if (annotation.type === 'url_citation') {
                sources.push({
                  url: annotation.url,
                  snippet: annotation.title || '',
                });
              }
            }
          }
        }
      }
    }

    return { value: text, sources };
  } catch (err) {
    // Fallback: use regular chat completion with a search-oriented prompt
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a web research assistant. Provide accurate, well-sourced information.',
          },
          { role: 'user', content: query },
        ],
      });

      const content = response.choices[0]?.message?.content;
      return { value: content || '' };
    } catch (fallbackErr) {
      const message =
        fallbackErr instanceof Error
          ? fallbackErr.message
          : String(fallbackErr);
      return { error: message };
    }
  }
}
