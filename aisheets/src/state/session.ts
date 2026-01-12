import { isBrowser } from '@builder.io/qwik';
import type { RequestEventBase } from '@builder.io/qwik-city';
import type { User } from '@supabase/supabase-js';
import { appConfig } from '~/config';

export type { User };

/**
 * Session type for backward compatibility with HuggingFace-style session.
 * Contains user info and token for inference API calls.
 */
export interface Session {
  user: {
    id: string;
    username: string;
    email?: string;
  };
  token: string;
  anonymous?: boolean;
}

/**
 * Get the current user from the server request event.
 * Returns null if not authenticated.
 */
export const useServerUser = ({
  sharedMap,
}: RequestEventBase<QwikCityPlatform>): User | null => {
  if (isBrowser) {
    throw new Error('useServerUser must be used on the server.');
  }

  return sharedMap.get('user') ?? null;
};

/**
 * Get the current session from the server request event.
 * Returns a Session object with user info and HuggingFace token for API calls.
 * This provides backward compatibility with the old HuggingFace OAuth session format.
 */
export const useServerSession = (
  event: RequestEventBase<QwikCityPlatform>,
): Session => {
  if (isBrowser) {
    throw new Error('useServerSession must be used on the server.');
  }

  const user = useServerUser(event);

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get HuggingFace token from app config for inference API calls
  const hfToken = appConfig.authentication.hfToken;

  if (!hfToken) {
    throw new Error('HF_TOKEN environment variable is required for inference API calls');
  }

  return {
    user: {
      id: user.id,
      username: user.email?.split('@')[0] || user.id,
      email: user.email,
    },
    token: hfToken,
    anonymous: false,
  };
};

/**
 * Require authentication - throws if user is not authenticated.
 */
export const requireServerUser = ({
  sharedMap,
}: RequestEventBase<QwikCityPlatform>): User => {
  const user = useServerUser({ sharedMap } as RequestEventBase<QwikCityPlatform>);

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
};
