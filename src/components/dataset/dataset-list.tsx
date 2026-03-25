'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateDatasetDialog } from './create-dialog';
import { ImportDialog } from './import-dialog';
import { AutoDatasetWizard } from './autodataset-wizard';
import type { Dataset } from '@/lib/types/domain';

export function DatasetList({
  initialDatasets,
}: {
  initialDatasets: Dataset[];
}) {
  const [datasets, setDatasets] = useState(initialDatasets);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAutoDataset, setShowAutoDataset] = useState(false);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('datasets').delete().eq('id', id);
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <>
      <div className="mb-6 flex gap-2">
        <Button onClick={() => setShowCreate(true)}>New Dataset</Button>
        <Button variant="outline" onClick={() => setShowImport(true)}>
          Import CSV/JSON
        </Button>
        <Button variant="secondary" onClick={() => setShowAutoDataset(true)}>
          AutoDataset
        </Button>
      </div>

      {datasets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 py-16">
          <p className="text-sm text-zinc-500">No datasets yet</p>
          <p className="mt-1 text-xs text-zinc-600">
            Create one or use AutoDataset to generate from a description
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {datasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="cursor-pointer border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700"
              onClick={() => router.push(`/dataset/${dataset.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div>
                  <CardTitle className="text-base text-zinc-100">
                    {dataset.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Created{' '}
                    {formatDistanceToNow(new Date(dataset.created_at), {
                      addSuffix: true,
                    })}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ···
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(dataset.id);
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <CreateDatasetDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(dataset) => {
          setDatasets((prev) => [dataset, ...prev]);
          router.push(`/dataset/${dataset.id}`);
        }}
      />

      <ImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImported={(dataset) => {
          setDatasets((prev) => [dataset, ...prev]);
          router.push(`/dataset/${dataset.id}`);
        }}
      />

      <AutoDatasetWizard
        open={showAutoDataset}
        onOpenChange={setShowAutoDataset}
        onCreated={(datasetId) => {
          router.push(`/dataset/${datasetId}`);
          router.refresh();
        }}
      />
    </>
  );
}
