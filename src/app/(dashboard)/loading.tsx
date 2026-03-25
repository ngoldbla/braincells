import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="mt-2 h-4 w-72 bg-zinc-800" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
