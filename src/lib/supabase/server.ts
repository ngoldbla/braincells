import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local or Vercel project settings.',
    );
    // Return a stub that satisfies the SupabaseClient interface without network calls.
    // auth.getUser() returns null user, so layouts redirect to /login.
    // Query methods return empty data, so pages render safely during build.
    // Note: the query builder is thenable (has .then) so `await supabase.from(...).select(...)` works,
    // but the root stub must NOT have .then or `await createClient()` would unwrap it.
    const queryBuilder: any = {
      select: () => queryBuilder,
      insert: () => queryBuilder,
      update: () => queryBuilder,
      delete: () => queryBuilder,
      eq: () => queryBuilder,
      order: () => queryBuilder,
      single: () => queryBuilder,
      then: (resolve: any) => resolve({ data: [], error: null }),
    };
    const stub: any = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => queryBuilder,
    };
    return stub;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    },
  );
}
