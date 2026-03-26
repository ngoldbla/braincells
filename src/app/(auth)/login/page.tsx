'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-zinc-100">
          braincells
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-zinc-300 hover:text-zinc-100">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
