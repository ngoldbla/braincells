import { createClient } from '@/lib/supabase/server';
import { getDataset } from '@/lib/supabase/queries/datasets';
import { getDatasetColumns } from '@/lib/supabase/queries/columns';
import { notFound } from 'next/navigation';
import { Spreadsheet } from '@/components/table/spreadsheet';

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  let dataset;
  try {
    dataset = await getDataset(supabase, id);
  } catch {
    notFound();
  }

  const columns = await getDatasetColumns(supabase, id);

  return <Spreadsheet dataset={dataset} initialColumns={columns} />;
}
