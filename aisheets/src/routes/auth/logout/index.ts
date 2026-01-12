import type { RequestHandler } from '@builder.io/qwik-city';
import { createSupabaseServerClient } from '~/services/supabase/server';

export const onGet: RequestHandler = async (event) => {
  const supabase = createSupabaseServerClient(event);

  await supabase.auth.signOut();

  throw event.redirect(302, '/auth/login');
};
