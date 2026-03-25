import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { LogoutButton } from '@/components/logout-button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 px-6">
          <Link
            href="/"
            className="font-mono text-sm font-bold tracking-tight text-zinc-100"
          >
            AI Sheets
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Settings
            </Link>
            <span className="text-xs text-zinc-600">{user.email}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
