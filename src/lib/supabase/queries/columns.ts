import { SupabaseClient } from '@supabase/supabase-js';
import type { ColumnKind } from '@/lib/types/domain';

export async function getDatasetColumns(
  supabase: SupabaseClient,
  datasetId: string,
) {
  const { data, error } = await supabase
    .from('columns')
    .select(
      `
      *,
      processes (*)
    `,
    )
    .eq('dataset_id', datasetId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createColumn(
  supabase: SupabaseClient,
  params: {
    dataset_id: string;
    name: string;
    type?: string;
    kind: ColumnKind;
    position: number;
  },
) {
  const { data, error } = await supabase
    .from('columns')
    .insert({
      dataset_id: params.dataset_id,
      name: params.name,
      type: params.type || 'text',
      kind: params.kind,
      position: params.position,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateColumn(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{
    name: string;
    type: string;
    visible: boolean;
    position: number;
  }>,
) {
  const { error } = await supabase
    .from('columns')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteColumn(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('columns').delete().eq('id', id);
  if (error) throw error;
}

export async function getMaxPosition(
  supabase: SupabaseClient,
  datasetId: string,
) {
  const { data } = await supabase
    .from('columns')
    .select('position')
    .eq('dataset_id', datasetId)
    .order('position', { ascending: false })
    .limit(1);

  return data && data.length > 0 ? data[0].position : -1;
}
