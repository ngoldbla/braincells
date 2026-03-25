import { Skeleton } from '@/components/ui/skeleton';

export default function DatasetLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex h-12 items-center gap-4 border-b border-zinc-800 px-4">
        <Skeleton className="h-6 w-48 bg-zinc-800" />
      </div>
      <div className="flex-1 p-4">
        <div className="grid gap-px bg-zinc-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-px">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="h-16 flex-1 bg-zinc-900"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
