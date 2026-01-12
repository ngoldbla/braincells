import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '~/types/supabase';

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates a Supabase client for browser-side use.
 * Uses singleton pattern to avoid creating multiple clients.
 */
export const createClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

  return supabaseClient;
};

/**
 * Get the current session from the browser client.
 */
export const getSession = async () => {
  const client = createClient();
  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
};

/**
 * Get the current user from the browser client.
 */
export const getUser = async () => {
  const client = createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
};

/**
 * Sign out the current user.
 */
export const signOut = async () => {
  const client = createClient();
  const { error } = await client.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
