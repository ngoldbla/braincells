import { createClient } from '@/lib/supabase/server';
import { getDatasets } from '@/lib/supabase/queries/datasets';
import { DatasetList } from '@/components/dataset/dataset-list';

export default async function DashboardPage() {
  const supabase = await createClient();
  const datasets = await getDatasets(supabase);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Datasets</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create and manage AI-powered datasets
          </p>
        </div>
      </div>
      <DatasetList initialDatasets={datasets} />
    </div>
  );
}
