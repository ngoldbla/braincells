// Provider types matching Rust backend

export enum ProviderType {
  CloudOpenAI = 'cloud_openai',
  CloudAnthropic = 'cloud_anthropic',
  CloudCustom = 'cloud_custom',
  LocalOllama = 'local_ollama',
  LocalVLLM = 'local_vllm',
}

export enum LocalRuntime {
  Ollama = 'ollama',
  VLLM = 'vllm',
}

export interface CloudCredentials {
  api_key: string;
  base_url: string;
  model_name: string;
}

export interface LocalLLMConfig {
  runtime: LocalRuntime;
  model_path?: string;
  port: number;
  gpu_enabled: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  provider_type: ProviderType;
  credentials?: CloudCredentials;
  local_config?: LocalLLMConfig;
  is_default: boolean;
}

export interface GenerateRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
  system_message?: string;
}

export interface GenerateResponse {
  text: string;
  model: string;
  finish_reason?: string;
  tokens_used?: number;
}

export interface ProviderStatus {
  is_available: boolean;
  is_running: boolean;
  message: string;
  version?: string;
}

export interface DownloadProgress {
  total_bytes: number;
  downloaded_bytes: number;
  percentage: number;
  status: string;
}

export interface SystemRequirements {
  total_memory_gb: number;
  available_memory_gb: number;
  has_gpu: boolean;
  gpu_name?: string;
  disk_space_gb: number;
  meets_requirements: boolean;
}

export enum InstallStatus {
  NotInstalled = 'NotInstalled',
  Installing = 'Installing',
  Installed = 'Installed',
  Failed = 'Failed',
}
