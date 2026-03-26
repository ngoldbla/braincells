import { SupabaseClient } from '@supabase/supabase-js';

export async function insertEmbeddings(
  supabase: SupabaseClient,
  rows: Array<{
    dataset_id: string;
    source_uri: string;
    text: string;
    embedding: number[];
  }>,
) {
  const CHUNK_SIZE = 100;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('embeddings').insert(chunk);
    if (error) throw error;
  }
}

export async function searchEmbeddings(
  supabase: SupabaseClient,
  datasetId: string,
  queryEmbedding: number[],
  limit = 15,
) {
  // Use pgvector cosine distance via RPC
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    match_dataset_id: datasetId,
    match_count: limit,
  });

  if (error) throw error;
  return data as Array<{
    source_uri: string;
    text: string;
    similarity: number;
  }>;
}
