// Wrapper functions for Tauri commands
import { invoke } from '@tauri-apps/api/core';
import type {
  ProviderConfig,
  ProviderType,
  ProviderStatus,
  GenerateResponse,
  SystemRequirements,
} from '../types/provider';
import type {
  Dataset,
  Column,
  Cell,
  TableView,
} from '../types/database';

// LLM Commands
export async function testCloudConnection(
  apiKey: string,
  baseUrl: string,
  model: string,
  providerType: ProviderType
): Promise<boolean> {
  return invoke('test_cloud_connection', {
    apiKey,
    baseUrl,
    model,
    providerType,
  });
}

export async function checkOllamaStatus(): Promise<ProviderStatus> {
  return invoke('check_ollama_status');
}

export async function startOllama(
  port?: number,
  gpuEnabled?: boolean
): Promise<void> {
  return invoke('start_ollama', { port, gpuEnabled });
}

export async function pullOllamaModel(
  modelName: string,
  port?: number
): Promise<void> {
  return invoke('pull_ollama_model', { modelName, port });
}

export async function listModels(
  config: ProviderConfig
): Promise<string[]> {
  return invoke('list_models', { config });
}

export async function generateText(
  config: ProviderConfig,
  prompt: string,
  maxTokens?: number,
  temperature?: number,
  systemMessage?: string
): Promise<GenerateResponse> {
  return invoke('generate_text', {
    config,
    prompt,
    maxTokens,
    temperature,
    systemMessage,
  });
}

export async function checkProviderStatus(
  config: ProviderConfig
): Promise<ProviderStatus> {
  return invoke('check_provider_status', { config });
}

// Config Commands
export async function getAppDataDirectory(): Promise<string> {
  return invoke('get_app_data_directory');
}

export async function getAppConfigDirectory(): Promise<string> {
  return invoke('get_app_config_directory');
}

export async function getModelsDirectory(): Promise<string> {
  return invoke('get_models_directory');
}

export async function getDatabaseDirectory(): Promise<string> {
  return invoke('get_database_directory');
}

export async function getPlatform(): Promise<string> {
  return invoke('get_platform');
}

export async function getOllamaDownloadUrl(): Promise<string> {
  return invoke('get_ollama_download_url_cmd');
}

// Process Commands
export async function isOllamaInstalled(): Promise<boolean> {
  return invoke('is_ollama_installed_cmd');
}

export async function getOllamaVersion(): Promise<string | null> {
  return invoke('get_ollama_version_cmd');
}

export async function installOllama(): Promise<string> {
  return invoke('install_ollama_cmd');
}

export async function checkSystemRequirements(): Promise<SystemRequirements> {
  return invoke('check_system_requirements');
}

// ==================== DATABASE COMMANDS ====================

// Dataset Commands
export async function createDataset(
  name: string,
  description?: string
): Promise<Dataset> {
  return invoke('create_dataset', { name, description });
}

export async function listDatasets(): Promise<Dataset[]> {
  return invoke('list_datasets');
}

export async function getDataset(datasetId: string): Promise<Dataset | null> {
  return invoke('get_dataset', { datasetId });
}

export async function deleteDataset(datasetId: string): Promise<void> {
  return invoke('delete_dataset', { datasetId });
}

// Column Commands
export async function addColumn(
  datasetId: string,
  name: string,
  columnType: string,
  prompt?: string,
  providerId?: string,
  position?: number
): Promise<Column> {
  return invoke('add_column', {
    datasetId,
    name,
    columnType,
    prompt,
    providerId,
    position: position ?? 0,
  });
}

export async function listColumns(datasetId: string): Promise<Column[]> {
  return invoke('list_columns', { datasetId });
}

export async function deleteColumn(columnId: string): Promise<void> {
  return invoke('delete_column', { columnId });
}

// Cell Commands
export async function updateCell(
  datasetId: string,
  columnId: string,
  rowIndex: number,
  value?: string
): Promise<void> {
  return invoke('update_cell', {
    datasetId,
    columnId,
    rowIndex,
    value,
  });
}

export async function getColumnCells(columnId: string): Promise<Cell[]> {
  return invoke('get_column_cells', { columnId });
}

// Table View Commands
export async function getTableView(
  datasetId: string,
  limit?: number,
  offset?: number
): Promise<TableView | null> {
  return invoke('get_table_view', { datasetId, limit, offset });
}

export async function countRows(datasetId: string): Promise<number> {
  return invoke('count_rows', { datasetId });
}

// Import/Export Commands
export async function importCsv(
  datasetId: string,
  csvContent: string
): Promise<void> {
  return invoke('import_csv', { datasetId, csvContent });
}

export async function exportCsv(datasetId: string): Promise<string> {
  return invoke('export_csv', { datasetId });
}

// Generator Commands
export interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  current_row: number | null;
}

export async function generateColumnCells(
  datasetId: string,
  columnId: string,
  providerConfig: ProviderConfig
): Promise<GenerationProgress> {
  return invoke('generate_column_cells', {
    datasetId,
    columnId,
    providerConfig,
  });
}
