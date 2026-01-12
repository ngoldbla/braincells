import type { RequestHandler } from '@builder.io/qwik-city';
import { createSupabaseServerClient } from '~/services/supabase/server';

export const onGet: RequestHandler = async (event) => {
  const { url, redirect } = event;
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/home';

  if (code) {
    const supabase = createSupabaseServerClient(event);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      throw redirect(302, next);
    }
  }

  // If there's no code or an error, redirect to login
  throw redirect(302, '/auth/login');
};
