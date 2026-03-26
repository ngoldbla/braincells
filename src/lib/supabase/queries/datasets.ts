import { SupabaseClient } from '@supabase/supabase-js';

export async function getDatasets(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDataset(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDataset(
  supabase: SupabaseClient,
  name: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('datasets')
    .insert({ name, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDataset(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('datasets').delete().eq('id', id);
  if (error) throw error;
}

export async function renameDataset(
  supabase: SupabaseClient,
  id: string,
  name: string,
) {
  const { error } = await supabase
    .from('datasets')
    .update({ name })
    .eq('id', id);
  if (error) throw error;
}
