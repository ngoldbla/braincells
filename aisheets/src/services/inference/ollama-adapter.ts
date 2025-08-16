/**
 * Ollama adapter for inference operations
 * This adapter converts between the Hugging Face interface and Ollama's API
 */

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt?: string;
  messages?: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  eval_count?: number;
}

export interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Check if Ollama is configured and enabled
 */
export function isOllamaEnabled(): boolean {
  const endpoint = process.env.MODEL_ENDPOINT_URL;
  return endpoint?.includes('ollama') || endpoint?.includes('11434') || false;
}

/**
 * Get Ollama endpoint URL
 */
export function getOllamaEndpoint(): string {
  const endpoint = process.env.MODEL_ENDPOINT_URL || 'http://localhost:11434';
  // Clean up the endpoint - remove /api/generate if present
  return endpoint.replace(/\/api\/(generate|chat|embeddings)$/, '');
}

/**
 * Call Ollama's generate API for chat completion
 */
export async function ollamaGenerate(
  messages: OllamaMessage[],
  model: string,
  stream: boolean = false
): Promise<string | AsyncGenerator<string>> {
  const endpoint = getOllamaEndpoint();
  const url = `${endpoint}/api/chat`;
  
  const request: OllamaGenerateRequest = {
    model: model || 'llama3.2',
    messages,
    stream,
    options: {
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  if (!stream) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || data.response || '';
  } else {
    // For streaming, return an async generator
    return ollamaStreamGenerate(url, request);
  }
}

/**
 * Stream responses from Ollama
 */
async function* ollamaStreamGenerate(
  url: string,
  request: OllamaGenerateRequest
): AsyncGenerator<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Ollama stream request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) {
          accumulated += json.message.content;
          yield accumulated;
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  }
}

/**
 * Call Ollama's embeddings API
 */
export async function ollamaEmbed(
  text: string,
  model: string = 'nomic-embed-text'
): Promise<number[]> {
  const endpoint = getOllamaEndpoint();
  const url = `${endpoint}/api/embeddings`;
  
  const request: OllamaEmbeddingRequest = {
    model,
    prompt: text,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Ollama embeddings request failed: ${response.statusText}`);
  }

  const data: OllamaEmbeddingResponse = await response.json();
  return data.embedding;
}

/**
 * List available Ollama models
 */
export async function ollamaListModels(): Promise<string[]> {
  const endpoint = getOllamaEndpoint();
  const url = `${endpoint}/api/tags`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to list Ollama models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (error) {
    console.error('Failed to list Ollama models:', error);
    return [];
  }
}

/**
 * Test Ollama connection
 */
export async function testOllamaConnection(): Promise<boolean> {
  try {
    const models = await ollamaListModels();
    return models.length > 0;
  } catch {
    return false;
  }
}