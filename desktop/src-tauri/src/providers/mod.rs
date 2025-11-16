use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use anyhow::Result;

pub mod cloud;
pub mod ollama;

/// The type of LLM provider
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ProviderType {
    CloudOpenAI,
    CloudAnthropic,
    CloudCustom,
    LocalOllama,
    LocalVLLM,
}

/// Cloud provider credentials
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudCredentials {
    pub api_key: String,
    pub base_url: String,
    pub model_name: String,
}

/// Local LLM configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalLLMConfig {
    pub runtime: LocalRuntime,
    pub model_path: Option<String>,
    pub port: u16,
    pub gpu_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LocalRuntime {
    Ollama,
    VLLM,
}

/// Complete provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub id: String,
    pub name: String,
    pub provider_type: ProviderType,
    pub credentials: Option<CloudCredentials>,
    pub local_config: Option<LocalLLMConfig>,
    pub is_default: bool,
}

/// Request for generating text
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub system_message: Option<String>,
}

/// Response from text generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub text: String,
    pub model: String,
    pub finish_reason: Option<String>,
    pub tokens_used: Option<u32>,
}

/// Health status of a provider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderStatus {
    pub is_available: bool,
    pub is_running: bool,
    pub message: String,
    pub version: Option<String>,
}

/// Progress update for model downloads
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub total_bytes: u64,
    pub downloaded_bytes: u64,
    pub percentage: f32,
    pub status: String,
}

/// Main trait that all LLM providers must implement
#[async_trait]
pub trait LLMProvider: Send + Sync {
    /// Get the provider type
    fn provider_type(&self) -> ProviderType;

    /// Check if the provider is available and ready
    async fn check_status(&self) -> Result<ProviderStatus>;

    /// Initialize and start the provider (for local providers)
    async fn start(&mut self) -> Result<()>;

    /// Stop the provider (for local providers)
    async fn stop(&mut self) -> Result<()>;

    /// Generate text from a prompt
    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse>;

    /// Test the connection/configuration
    async fn test_connection(&self) -> Result<bool>;

    /// List available models for this provider
    async fn list_models(&self) -> Result<Vec<String>>;
}

/// Factory function to create a provider from configuration
pub fn create_provider(config: &ProviderConfig) -> Result<Box<dyn LLMProvider>> {
    match config.provider_type {
        ProviderType::CloudOpenAI => {
            let credentials = config.credentials.as_ref()
                .ok_or_else(|| anyhow::anyhow!("Missing credentials for OpenAI"))?;
            Ok(Box::new(cloud::OpenAIProvider::new(credentials.clone())?))
        }
        ProviderType::CloudAnthropic => {
            let credentials = config.credentials.as_ref()
                .ok_or_else(|| anyhow::anyhow!("Missing credentials for Anthropic"))?;
            Ok(Box::new(cloud::AnthropicProvider::new(credentials.clone())?))
        }
        ProviderType::CloudCustom => {
            let credentials = config.credentials.as_ref()
                .ok_or_else(|| anyhow::anyhow!("Missing credentials for Custom provider"))?;
            Ok(Box::new(cloud::CustomProvider::new(credentials.clone())?))
        }
        ProviderType::LocalOllama => {
            let local_config = config.local_config.as_ref()
                .ok_or_else(|| anyhow::anyhow!("Missing local config for Ollama"))?;
            Ok(Box::new(ollama::OllamaProvider::new(local_config.clone())?))
        }
        ProviderType::LocalVLLM => {
            // TODO: Implement vLLM provider
            Err(anyhow::anyhow!("vLLM provider not yet implemented"))
        }
    }
}
