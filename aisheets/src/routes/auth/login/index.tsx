import { component$ } from '@builder.io/qwik';
import {
  type DocumentHead,
  Form,
  routeAction$,
  zod$,
  z,
  Link,
} from '@builder.io/qwik-city';
import { createSupabaseServerClient } from '~/services/supabase/server';

export const useLogin = routeAction$(
  async (data, event) => {
    const supabase = createSupabaseServerClient(event);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    throw event.redirect(302, '/home');
  },
  zod$({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
);

export default component$(() => {
  const loginAction = useLogin();

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div class="w-full max-w-md space-y-8">
        <div>
          <h1 class="text-center text-3xl font-bold tracking-tight text-gray-900">
            Brain Cells
          </h1>
          <h2 class="mt-2 text-center text-xl text-gray-600">
            Sign in to your account
          </h2>
        </div>

        <Form action={loginAction} class="mt-8 space-y-6">
          {loginAction.value?.error && (
            <div class="rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-700">{loginAction.value.error}</p>
            </div>
          )}

          <div class="space-y-4">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="you@example.com"
              />
              {loginAction.value?.fieldErrors?.email && (
                <p class="mt-1 text-sm text-red-600">
                  {loginAction.value.fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Enter your password"
              />
              {loginAction.value?.fieldErrors?.password && (
                <p class="mt-1 text-sm text-red-600">
                  {loginAction.value.fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loginAction.isRunning}
              class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loginAction.isRunning ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <p class="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Sign In - Brain Cells',
  meta: [
    {
      name: 'description',
      content: 'Sign in to Brain Cells - Intelligent Spreadsheet Automation',
    },
  ],
};
