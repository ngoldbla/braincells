import { SupabaseClient } from '@supabase/supabase-js';

export async function getCellValues(
  supabase: SupabaseClient,
  datasetId: string,
  columnIds: string[],
  offset: number,
  limit: number,
) {
  const { data, error } = await supabase
    .from('cell_values')
    .select('*')
    .eq('dataset_id', datasetId)
    .in('column_id', columnIds)
    .gte('row_idx', offset)
    .lt('row_idx', offset + limit)
    .order('row_idx', { ascending: true });

  if (error) throw error;
  return data;
}

export async function upsertCellValue(
  supabase: SupabaseClient,
  params: {
    dataset_id: string;
    column_id: string;
    row_idx: number;
    value: any;
  },
) {
  const { error } = await supabase.from('cell_values').upsert(
    {
      dataset_id: params.dataset_id,
      column_id: params.column_id,
      row_idx: params.row_idx,
      value: params.value,
    },
    { onConflict: 'dataset_id,column_id,row_idx' },
  );

  if (error) throw error;
}

export async function bulkUpsertCellValues(
  supabase: SupabaseClient,
  rows: Array<{
    dataset_id: string;
    column_id: string;
    row_idx: number;
    value: any;
  }>,
) {
  // Process in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('cell_values')
      .upsert(chunk, { onConflict: 'dataset_id,column_id,row_idx' });

    if (error) throw error;
  }
}

export async function deleteCellValues(
  supabase: SupabaseClient,
  datasetId: string,
  rowIdxs: number[],
) {
  const { error } = await supabase
    .from('cell_values')
    .delete()
    .eq('dataset_id', datasetId)
    .in('row_idx', rowIdxs);

  if (error) throw error;
}

export async function getRowCount(
  supabase: SupabaseClient,
  datasetId: string,
  columnId: string,
) {
  const { count, error } = await supabase
    .from('cell_values')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', datasetId)
    .eq('column_id', columnId);

  if (error) throw error;
  return count || 0;
}

export async function getRowCells(
  supabase: SupabaseClient,
  rowIdx: number,
  columnIds: string[],
) {
  if (columnIds.length === 0) return [];

  const { data, error } = await supabase
    .from('cell_values')
    .select('*, columns!inner(name)')
    .in('column_id', columnIds)
    .eq('row_idx', rowIdx);

  if (error) throw error;
  return data;
}
