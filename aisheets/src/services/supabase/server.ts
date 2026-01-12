import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { RequestEvent } from '@builder.io/qwik-city';
import type { Database } from '~/types/supabase';

/**
 * Creates a Supabase client for server-side use in Qwik.
 * This client handles cookie-based session management.
 */
export const createSupabaseServerClient = (event: RequestEvent) => {
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
export const getUser = async (event: RequestEvent) => {
  const supabase = createSupabaseServerClient(event);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Require authentication - throws redirect if not authenticated.
 */
export const requireAuth = async (event: RequestEvent) => {
  const user = await getUser(event);
  if (!user) {
    throw event.redirect(302, '/auth/login');
  }
  return user;
};
