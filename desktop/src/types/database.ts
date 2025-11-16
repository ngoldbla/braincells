// Database model types matching Rust backend

export interface Dataset {
  id: string;
  name: string;
  description: string | null;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

export enum ColumnType {
  Input = 'input',
  Output = 'output',
  Formula = 'formula',
}

export interface Column {
  id: string;
  dataset_id: string;
  name: string;
  column_type: ColumnType;
  prompt: string | null;
  provider_id: string | null;
  position: number;
  created_at: string; // ISO 8601 datetime
}

export enum CellStatus {
  Pending = 'pending',
  Processing = 'processing',
  Complete = 'complete',
  Error = 'error',
}

export interface Cell {
  id: string;
  dataset_id: string;
  column_id: string;
  row_index: number;
  value: string | null;
  status: CellStatus;
  error: string | null;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}

export interface Row {
  index: number;
  cells: Record<string, Cell>;
}

export interface TableView {
  dataset: Dataset;
  columns: Column[];
  rows: Row[];
  total_rows: number;
}

// Request/Response types for API calls

export interface CreateDatasetRequest {
  name: string;
  description?: string;
}

export interface AddColumnRequest {
  dataset_id: string;
  name: string;
  column_type: string;
  prompt?: string;
  provider_id?: string;
  position: number;
}

export interface UpdateCellRequest {
  dataset_id: string;
  column_id: string;
  row_index: number;
  value?: string;
}

export interface GetTableViewRequest {
  dataset_id: string;
  limit?: number;
  offset?: number;
}

export interface ImportCsvRequest {
  dataset_id: string;
  csv_content: string;
}
