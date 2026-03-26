-- RPC function for vector similarity search
create or replace function search_embeddings(
  query_embedding vector(1536),
  match_dataset_id uuid,
  match_count int default 15
)
returns table (
  source_uri text,
  text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    e.source_uri,
    e.text,
    1 - (e.embedding <=> query_embedding) as similarity
  from embeddings e
  where e.dataset_id = match_dataset_id
  order by e.embedding <=> query_embedding
  limit match_count;
end;
$$;
