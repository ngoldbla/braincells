import { SupabaseClient } from '@supabase/supabase-js';

export async function getCellMeta(
  supabase: SupabaseClient,
  columnId: string,
  rowIdx: number,
) {
  const { data, error } = await supabase
    .from('column_cells')
    .select('*')
    .eq('column_id', columnId)
    .eq('row_idx', rowIdx)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertCellMeta(
  supabase: SupabaseClient,
  params: {
    column_id: string;
    row_idx: number;
    generating?: boolean;
    validated?: boolean;
    error?: string | null;
    sources?: any;
  },
) {
  const { error } = await supabase.from('column_cells').upsert(
    {
      column_id: params.column_id,
      row_idx: params.row_idx,
      generating: params.generating ?? false,
      validated: params.validated ?? false,
      error: params.error ?? null,
      sources: params.sources ?? null,
    },
    { onConflict: 'column_id,row_idx' },
  );

  if (error) throw error;
}

export async function getCellMetaBatch(
  supabase: SupabaseClient,
  columnId: string,
  offset: number,
  limit: number,
) {
  const { data, error } = await supabase
    .from('column_cells')
    .select('*')
    .eq('column_id', columnId)
    .gte('row_idx', offset)
    .lt('row_idx', offset + limit)
    .order('row_idx', { ascending: true });

  if (error) throw error;
  return data;
}
