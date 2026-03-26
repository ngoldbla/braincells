export type ColumnKind = 'static' | 'dynamic';

export type TaskType =
  | 'text-generation'
  | 'text-to-image'
  | 'image-text-to-text'
  | 'speech'
  | 'transcription';

export interface CellSource {
  url: string;
  snippet: string;
}

export interface Process {
  id?: string;
  prompt: string;
  model: string;
  task: TaskType;
  search_enabled: boolean;
  image_column_id?: string;
  columns_references?: string[];
  // Client-only state
  processed_cells?: number;
  is_executing?: boolean;
  offset?: number;
  limit?: number;
}

export interface Cell {
  id?: string;
  row_idx: number;
  generating: boolean;
  validated: boolean;
  value?: any;
  error?: string;
  sources?: CellSource[];
  column_id?: string;
}

export interface Column {
  id: string;
  dataset_id: string;
  name: string;
  type: string;
  kind: ColumnKind;
  visible: boolean;
  position: number;
  process?: Process;
  cells: Cell[];
}

export interface Dataset {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface AutoDatasetConfig {
  datasetName: string;
  columns: Array<{ name: string; prompt: string; type: string }>;
  queries: string[];
  text: string;
}

export const DEFAULT_MODEL = 'gpt-4o-mini';
export const MAX_CONCURRENCY = 5;
export const EXAMPLES_PROMPT_MAX_CONTEXT_SIZE = 8192;
export const SOURCES_PROMPT_MAX_CONTEXT_SIZE = 61440;
export const MAX_ROWS_IMPORT = 1000;
