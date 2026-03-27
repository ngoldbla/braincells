'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
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
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGoogleSignIn}
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Sign in with Google'}
        </Button>
      </CardFooter>
    </Card>
  );
}
