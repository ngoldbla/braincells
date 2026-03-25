import { SupabaseClient } from '@supabase/supabase-js';
import type { TaskType } from '@/lib/types/domain';

export async function getProcess(
  supabase: SupabaseClient,
  columnId: string,
) {
  const { data, error } = await supabase
    .from('processes')
    .select('*, process_columns(column_id)')
    .eq('column_id', columnId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertProcess(
  supabase: SupabaseClient,
  params: {
    column_id: string;
    prompt: string;
    model: string;
    task: TaskType;
    search_enabled: boolean;
    image_column_id?: string | null;
    columns_references?: string[];
  },
) {
  // Upsert the process
  const { data: process, error } = await supabase
    .from('processes')
    .upsert(
      {
        column_id: params.column_id,
        prompt: params.prompt,
        model: params.model,
        task: params.task,
        search_enabled: params.search_enabled,
        image_column_id: params.image_column_id || null,
      },
      { onConflict: 'column_id' },
    )
    .select()
    .single();

  if (error) throw error;

  // Update column references
  if (params.columns_references) {
    // Delete existing references
    await supabase
      .from('process_columns')
      .delete()
      .eq('process_id', process.id);

    // Insert new references
    if (params.columns_references.length > 0) {
      const refs = params.columns_references.map((colId) => ({
        process_id: process.id,
        column_id: colId,
      }));

      const { error: refError } = await supabase
        .from('process_columns')
        .insert(refs);

      if (refError) throw refError;
    }
  }

  return process;
}

export async function deleteProcess(
  supabase: SupabaseClient,
  columnId: string,
) {
  const { error } = await supabase
    .from('processes')
    .delete()
    .eq('column_id', columnId);
  if (error) throw error;
}
