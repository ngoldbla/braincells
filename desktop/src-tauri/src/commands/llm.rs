use crate::providers::*;
use anyhow::Result;

/// Test connection to a cloud provider
#[tauri::command]
pub async fn test_cloud_connection(
    api_key: String,
    base_url: String,
    model: String,
    provider_type: ProviderType,
) -> Result<bool, String> {
    let credentials = CloudCredentials {
        api_key,
        base_url,
        model_name: model,
    };

    let provider: Box<dyn LLMProvider> = match provider_type {
        ProviderType::CloudOpenAI => {
            Box::new(cloud::OpenAIProvider::new(credentials)
                .map_err(|e| e.to_string())?)
        },
        ProviderType::CloudAnthropic => {
            Box::new(cloud::AnthropicProvider::new(credentials)
                .map_err(|e| e.to_string())?)
        },
        ProviderType::CloudCustom => {
            Box::new(cloud::CustomProvider::new(credentials)
                .map_err(|e| e.to_string())?)
        },
        _ => return Err("Invalid cloud provider type".to_string()),
    };

    provider.test_connection()
        .await
        .map_err(|e| e.to_string())
}

/// Check the status of Ollama
#[tauri::command]
pub async fn check_ollama_status() -> Result<ProviderStatus, String> {
    let config = LocalLLMConfig {
        runtime: LocalRuntime::Ollama,
        model_path: None,
        port: 11434,
        gpu_enabled: true,
    };

    let provider = ollama::OllamaProvider::new(config)
        .map_err(|e| e.to_string())?;
    provider.check_status()
        .await
        .map_err(|e| e.to_string())
}

/// Start Ollama service
#[tauri::command]
pub async fn start_ollama(port: Option<u16>, gpu_enabled: Option<bool>) -> Result<(), String> {
    let config = LocalLLMConfig {
        runtime: LocalRuntime::Ollama,
        model_path: None,
        port: port.unwrap_or(11434),
        gpu_enabled: gpu_enabled.unwrap_or(true),
    };

    let mut provider = ollama::OllamaProvider::new(config)
        .map_err(|e| e.to_string())?;
    provider.start()
        .await
        .map_err(|e| e.to_string())
}

/// Pull an Ollama model
#[tauri::command]
pub async fn pull_ollama_model(model_name: String, port: Option<u16>) -> Result<(), String> {
    let config = LocalLLMConfig {
        runtime: LocalRuntime::Ollama,
        model_path: None,
        port: port.unwrap_or(11434),
        gpu_enabled: true,
    };

    let provider = ollama::OllamaProvider::new(config)
        .map_err(|e| e.to_string())?;
    provider.pull_model(&model_name)
        .await
        .map_err(|e| e.to_string())
}

/// List available models for a provider
#[tauri::command]
pub async fn list_models(config: ProviderConfig) -> Result<Vec<String>, String> {
    let provider = create_provider(&config)
        .map_err(|e| e.to_string())?;

    provider.list_models()
        .await
        .map_err(|e| e.to_string())
}

/// Generate text using a provider
#[tauri::command]
pub async fn generate_text(
    config: ProviderConfig,
    prompt: String,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    system_message: Option<String>,
) -> Result<GenerateResponse, String> {
    let provider = create_provider(&config)
        .map_err(|e| e.to_string())?;

    let request = GenerateRequest {
        prompt,
        max_tokens,
        temperature,
        system_message,
    };

    provider.generate(request)
        .await
        .map_err(|e| e.to_string())
}

/// Check provider status
#[tauri::command]
pub async fn check_provider_status(config: ProviderConfig) -> Result<ProviderStatus, String> {
    let provider = create_provider(&config)
        .map_err(|e| e.to_string())?;

    provider.check_status()
        .await
        .map_err(|e| e.to_string())
}
