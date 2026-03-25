'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { TaskType } from '@/lib/types/domain';

export function CellRenderer({
  value,
  type,
  generating,
  error,
  task,
}: {
  value: any;
  type: string;
  generating?: boolean;
  error?: string;
  task?: TaskType;
}) {
  // Generating state
  if (generating) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full bg-zinc-800" />
        <Skeleton className="h-3 w-3/4 bg-zinc-800" />
        <Skeleton className="h-3 w-1/2 bg-zinc-800" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-xs text-red-400 leading-tight line-clamp-4">
        {error}
      </div>
    );
  }

  // Empty state
  if (value === null || value === undefined) {
    return <div className="text-xs text-zinc-700 italic">empty</div>;
  }

  // Image
  if (type === 'image' || task === 'text-to-image') {
    const src = String(value);
    if (src.startsWith('data:image') || src.startsWith('http')) {
      return (
        <img
          src={src}
          alt="Generated"
          className="h-20 w-auto rounded object-cover"
        />
      );
    }
  }

  // Audio
  if (task === 'speech') {
    const src = String(value);
    if (src.startsWith('data:audio') || src.startsWith('http')) {
      return (
        <audio controls className="h-8 w-full" preload="none">
          <source src={src} />
        </audio>
      );
    }
  }

  // Object/Array
  if (typeof value === 'object') {
    return (
      <pre className="text-xs text-zinc-400 leading-tight overflow-hidden line-clamp-5 font-mono">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  // Default text
  return (
    <div className="text-xs text-zinc-300 leading-tight line-clamp-5 whitespace-pre-wrap">
      {String(value)}
    </div>
  );
}
