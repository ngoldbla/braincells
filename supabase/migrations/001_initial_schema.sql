-- Enable pgvector
create extension if not exists vector;

-- Datasets
create table datasets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Columns (metadata)
create table columns (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  name text not null,
  type text not null default 'text',
  kind text not null check (kind in ('static', 'dynamic')),
  visible boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Cell metadata (generation status, validation, sources)
create table column_cells (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references columns(id) on delete cascade,
  row_idx integer not null,
  error text,
  validated boolean not null default false,
  generating boolean not null default false,
  sources jsonb,
  unique (column_id, row_idx)
);

-- Cell values (normalized — one row per cell)
create table cell_values (
  dataset_id uuid not null references datasets(id) on delete cascade,
  column_id uuid not null references columns(id) on delete cascade,
  row_idx integer not null,
  value jsonb,
  primary key (dataset_id, column_id, row_idx)
);

-- Process (AI generation config per column)
create table processes (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references columns(id) on delete cascade unique,
  prompt text not null,
  model text not null default 'gpt-4o-mini',
  task text not null check (task in ('text-generation', 'text-to-image', 'image-text-to-text', 'speech', 'transcription')),
  search_enabled boolean not null default false,
  image_column_id uuid references columns(id)
);

-- Process-column references (junction: which columns a process references in its prompt)
create table process_columns (
  process_id uuid not null references processes(id) on delete cascade,
  column_id uuid not null references columns(id) on delete cascade,
  primary key (process_id, column_id)
);

-- Embeddings (pgvector, replaces LanceDB)
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  source_uri text not null,
  text text not null,
  embedding vector(1536) not null
);

-- Indexes
create index idx_columns_dataset on columns(dataset_id);
create index idx_cell_values_dataset on cell_values(dataset_id);
create index idx_cell_values_column on cell_values(column_id);
create index idx_column_cells_column on column_cells(column_id);
create index idx_embeddings_dataset on embeddings(dataset_id);
create index idx_embeddings_vector on embeddings using hnsw (embedding vector_cosine_ops);

-- RLS
alter table datasets enable row level security;
alter table columns enable row level security;
alter table column_cells enable row level security;
alter table cell_values enable row level security;
alter table processes enable row level security;
alter table process_columns enable row level security;
alter table embeddings enable row level security;

-- Policies: users access only their own data
create policy "own_datasets" on datasets for all using (user_id = auth.uid());
create policy "own_columns" on columns for all using (
  dataset_id in (select id from datasets where user_id = auth.uid())
);
create policy "own_column_cells" on column_cells for all using (
  column_id in (select c.id from columns c join datasets d on c.dataset_id = d.id where d.user_id = auth.uid())
);
create policy "own_cell_values" on cell_values for all using (
  dataset_id in (select id from datasets where user_id = auth.uid())
);
create policy "own_processes" on processes for all using (
  column_id in (select c.id from columns c join datasets d on c.dataset_id = d.id where d.user_id = auth.uid())
);
create policy "own_process_columns" on process_columns for all using (
  process_id in (select p.id from processes p join columns c on p.column_id = c.id join datasets d on c.dataset_id = d.id where d.user_id = auth.uid())
);
create policy "own_embeddings" on embeddings for all using (
  dataset_id in (select id from datasets where user_id = auth.uid())
);
