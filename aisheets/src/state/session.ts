import { isBrowser } from '@builder.io/qwik';
import type { RequestEventBase } from '@builder.io/qwik-city';
import type { User } from '@supabase/supabase-js';

export type { User };

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
