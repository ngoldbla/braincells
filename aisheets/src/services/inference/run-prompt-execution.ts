import {
  type FeatureExtractionArgs,
  type InferenceProvider,
  type Options,
  chatCompletion,
  chatCompletionStream,
} from '@huggingface/inference';

import { isDev } from '@builder.io/qwik';
import { appConfig } from '~/config';
import { cacheGet, cacheSet, persistentCacheGet, persistentCacheSet } from '~/services/cache';
import { type Example, materializePrompt } from './materialize-prompt';

export interface PromptExecutionParams {
  modelName: string;
  modelProvider: string;
  instruction: string;
  sourcesContext?: {
    source_uri: string;
    text: string;
  }[];
  data: Record<string, any>;
  examples?: Array<Example>;
  idx?: number;
  stream?: boolean;

  timeout?: number;
  accessToken?: string;
  endpointUrl?: string;
}

export interface PromptExecutionResponse {
  value?: string;
  error?: string;
  done?: boolean;
}

export const handleError = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  return JSON.stringify(e);
};

export const runPromptExecution = async ({
  accessToken,
  modelName,
  modelProvider,
  instruction,
  sourcesContext,
  data,
  examples,
  timeout,
  endpointUrl,
}: PromptExecutionParams): Promise<PromptExecutionResponse> => {
  const inputPrompt = materializePrompt({
    instruction,
    sourcesContext,
    data,
    examples,
  });
  const args = normalizeChatCompletionArgs({
    messages: [{ role: 'user', content: inputPrompt }],
    modelProvider,
    modelName,
    accessToken,
    endpointUrl,
  });
  const options = normalizeOptions(timeout);

  if (isDev) showPromptInfo(modelName, modelProvider, endpointUrl, inputPrompt);

  try {
    const cacheKey = {
      modelName,
      modelProvider,
      endpointUrl,
      instruction,
      data,
      examples,
      withSources: sourcesContext && sourcesContext.length > 0,
    };

    // Try in-memory cache first, then persistent cache
    let cacheValue = cacheGet(cacheKey);
    if (!cacheValue) {
      cacheValue = persistentCacheGet(cacheKey);
      if (cacheValue) {
        // Promote to in-memory cache for faster access
        cacheSet(cacheKey, cacheValue);
      }
    }

    if (cacheValue) {
      return {
        value: cacheValue,
        done: true,
      };
    }

    const response = await chatCompletion(args, options);
    const result = response.choices[0].message.content;

    if (result?.toLocaleLowerCase().includes('no more items')) {
      throw new Error(result);
    }

    // Cache in both in-memory and persistent cache
    cacheSet(cacheKey, result);
    persistentCacheSet(cacheKey, result);

    return {
      value: result,
      done: true,
    };
  } catch (e) {
    return {
      error: handleError(e),
      done: true,
    };
  }
};

export const runPromptExecutionStream = async function* ({
  modelName,
  modelProvider,
  instruction,
  sourcesContext,
  data,
  examples,
  timeout,
  accessToken,
  endpointUrl,
}: PromptExecutionParams): AsyncGenerator<PromptExecutionResponse> {
  const inputPrompt = materializePrompt({
    instruction,
    sourcesContext,
    data,
    examples,
  });
  const args = normalizeChatCompletionArgs({
    messages: [{ role: 'user', content: inputPrompt }],
    modelProvider,
    modelName,
    accessToken,
    endpointUrl,
  });
  const options = normalizeOptions(timeout);

  if (isDev) showPromptInfo(modelName, modelProvider, endpointUrl, inputPrompt);

  const cacheKey = {
    modelName,
    modelProvider,
    endpointUrl,
    instruction,
    data,
    examples,
    withSources: sourcesContext && sourcesContext.length > 0,
  };

  // Try in-memory cache first, then persistent cache
  let cacheValue = cacheGet(cacheKey);
  if (!cacheValue) {
    cacheValue = persistentCacheGet(cacheKey);
    if (cacheValue) {
      // Promote to in-memory cache for faster access
      cacheSet(cacheKey, cacheValue);
    }
  }

  if (cacheValue) {
    yield {
      value: cacheValue,
      done: true,
    };
    return;
  }

  try {
    let accumulated = '';
    const stream = chatCompletionStream(args, options);

    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        accumulated += chunk.choices[0].delta.content;
        yield { value: accumulated, done: false };
      }
    }

    if (accumulated.toLocaleLowerCase().includes('no more items')) {
      throw new Error(accumulated);
    }

    // Cache the final result in both caches
    cacheSet(cacheKey, accumulated);
    persistentCacheSet(cacheKey, accumulated);

    yield {
      value: accumulated,
      done: true,
    };
  } catch (e) {
    yield { error: handleError(e), done: true };
  }
};

export const normalizeFeatureExtractionArgs = ({
  inputs,
  modelName,
  modelProvider,
  accessToken,
  endpointUrl,
}: {
  inputs: string[];
  modelName: string;
  modelProvider: string;
  accessToken?: string;
  endpointUrl?: string;
}): FeatureExtractionArgs => {
  const {
    authentication: { hfToken },
  } = appConfig;

  const args: FeatureExtractionArgs = {
    inputs,
    accessToken: hfToken ?? accessToken,
    // We must review the chunk strategy to avoid truncating the input
    truncate: true, // Otherwise, it will raise an error (see https://github.com/huggingface/text-embeddings-inference/issues/356)
  };

  if (endpointUrl) {
    args.endpointUrl = endpointUrl;
  } else {
    args.model = modelName;
    args.provider = modelProvider as InferenceProvider;
  }

  return args;
};

export const normalizeChatCompletionArgs = ({
  messages,
  modelName,
  modelProvider,
  accessToken,
  endpointUrl,
}: {
  messages: any[];
  modelName: string;
  modelProvider: string;
  accessToken?: string;
  endpointUrl?: string;
}) => {
  const {
    authentication: { hfToken },
  } = appConfig;

  const args: any = {
    messages,
    accessToken: hfToken ?? accessToken,
  };

  if (endpointUrl) {
    args.endpointUrl = endpointUrl;
    // When using endpointUrl, we use the modelName as the endpoint name
    // This is a required body parameter when using OpenAI-compatible endpoints
    // See https://platform.openai.com/docs/api-reference/chat/create#chat-create-model
    args.model = modelName;
  } else {
    args.model = modelName;
    args.provider = modelProvider as InferenceProvider;
  }

  return args;
};

export const normalizeOptions = (timeout?: number | undefined): Options => {
  const {
    inference: { billTo, timeout: defaultTimeout },
  } = appConfig;
  const options: Record<string, any> = {
    signal: AbortSignal.timeout(timeout ?? defaultTimeout),
  };

  if (billTo) options.billTo = billTo;

  return options;
};

function showPromptInfo(
  modelName: string,
  modelProvider: string,
  endpointUrl: string | undefined,
  inputPrompt: string,
) {
  console.log('\n🔷 Prompt 🔷');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Model:', modelName);
  if (endpointUrl) console.log('Endpoint URL:', endpointUrl);
  else console.log('Provider:', modelProvider);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Prompt:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(inputPrompt);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔷 End Prompt 🔷\n');
}
