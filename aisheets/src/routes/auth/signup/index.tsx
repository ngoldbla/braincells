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

export const useSignup = routeAction$(
  async (data, event) => {
    // Check password match manually since zod$ doesn't support refine
    if (data.password !== data.confirmPassword) {
      return {
        success: false,
        error: "Passwords don't match",
      };
    }

    const supabase = createSupabaseServerClient(event);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Auto-login after signup (Supabase handles this if email confirmation is disabled)
    throw event.redirect(302, '/home');
  },
  zod$({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }),
);

export default component$(() => {
  const signupAction = useSignup();

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div class="w-full max-w-md space-y-8">
        <div>
          <h1 class="text-center text-3xl font-bold tracking-tight text-gray-900">
            Brain Cells
          </h1>
          <h2 class="mt-2 text-center text-xl text-gray-600">
            Create your account
          </h2>
        </div>

        <Form action={signupAction} class="mt-8 space-y-6">
          {signupAction.value?.error && (
            <div class="rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-700">{signupAction.value.error}</p>
            </div>
          )}

          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="John Doe"
              />
              {signupAction.value?.fieldErrors?.name && (
                <p class="mt-1 text-sm text-red-600">
                  {signupAction.value.fieldErrors.name}
                </p>
              )}
            </div>

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
              {signupAction.value?.fieldErrors?.email && (
                <p class="mt-1 text-sm text-red-600">
                  {signupAction.value.fieldErrors.email}
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
                autoComplete="new-password"
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="At least 6 characters"
              />
              {signupAction.value?.fieldErrors?.password && (
                <p class="mt-1 text-sm text-red-600">
                  {signupAction.value.fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Confirm your password"
              />
              {signupAction.value?.fieldErrors?.confirmPassword && (
                <p class="mt-1 text-sm text-red-600">
                  {signupAction.value.fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={signupAction.isRunning}
              class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {signupAction.isRunning ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <p class="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              class="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Sign Up - Brain Cells',
  meta: [
    {
      name: 'description',
      content: 'Create your Brain Cells account - Intelligent Spreadsheet Automation',
    },
  ],
};
