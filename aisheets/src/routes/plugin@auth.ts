import type { RequestEvent } from '@builder.io/qwik-city';
import { createSupabaseServerClient } from '~/services/supabase/server';

export const onRequest = async (event: RequestEvent) => {
  const { sharedMap, redirect, pathname } = event;

  const supabase = createSupabaseServerClient(event);

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store supabase client and user in sharedMap for use in routes
  sharedMap.set('supabase', supabase);
  sharedMap.set('user', user);

  // Define protected routes that require authentication
  const protectedRoutes = ['/home'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !user) {
    throw redirect(302, '/auth/login');
  }

  // Redirect to home if already authenticated and trying to access auth pages
  const authRoutes = ['/auth/login', '/auth/signup'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && user) {
    throw redirect(302, '/home');
  }
};
