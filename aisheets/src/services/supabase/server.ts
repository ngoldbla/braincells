import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { RequestEventBase } from '@builder.io/qwik-city';
import type { Database } from '~/types/supabase';

/**
 * Creates a Supabase client for server-side use in Qwik.
 * This client handles cookie-based session management.
 * Works with RequestEvent, RequestEventAction, and RequestEventLoader.
 */
export const createSupabaseServerClient = (event: RequestEventBase<QwikCityPlatform>) => {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name: string) => {
        return event.cookie.get(name)?.value;
      },
      set: (name: string, value: string, options: CookieOptions) => {
        event.cookie.set(name, value, {
          path: '/',
          secure: true,
          sameSite: 'lax',
          httpOnly: true,
          ...options,
        });
      },
      remove: (name: string, options: CookieOptions) => {
        event.cookie.delete(name, {
          path: '/',
          ...options,
        });
      },
    },
  });
};

/**
 * Get the current user from the request event.
 * Returns null if not authenticated.
 */
export const getUser = async (event: RequestEventBase<QwikCityPlatform>) => {
  const supabase = createSupabaseServerClient(event);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};
