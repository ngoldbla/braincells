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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-zinc-100">
            Check your email
          </CardTitle>
          <CardDescription className="text-zinc-400">
            We sent a confirmation link to {email}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-zinc-300 hover:text-zinc-100">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-zinc-100">
          braincells
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Create your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
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
              minLength={6}
              required
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
          <p className="text-sm text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-zinc-300 hover:text-zinc-100">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
