// Wrapper functions for Tauri commands
import { invoke } from '@tauri-apps/api/core';
import type {
  ProviderConfig,
  ProviderType,
  ProviderStatus,
  GenerateResponse,
  SystemRequirements,
} from '../types/provider';

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
