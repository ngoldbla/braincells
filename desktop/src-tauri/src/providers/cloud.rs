use super::*;
use reqwest::{Client, header};
use serde_json::json;
use std::time::Duration;

/// OpenAI provider implementation
#[derive(Clone)]
pub struct OpenAIProvider {
    credentials: CloudCredentials,
    client: Client,
}

impl OpenAIProvider {
    pub fn new(credentials: CloudCredentials) -> Self {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", credentials.api_key))
                .expect("Invalid API key"),
        );

        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .default_headers(headers)
            .build()
            .expect("Failed to create HTTP client");

        Self { credentials, client }
    }
}

#[async_trait]
impl LLMProvider for OpenAIProvider {
    fn provider_type(&self) -> ProviderType {
        ProviderType::CloudOpenAI
    }

    async fn check_status(&self) -> Result<ProviderStatus> {
        match self.test_connection().await {
            Ok(true) => Ok(ProviderStatus {
                is_available: true,
                is_running: true,
                message: "OpenAI API is accessible".to_string(),
                version: Some("v1".to_string()),
            }),
            Ok(false) | Err(_) => Ok(ProviderStatus {
                is_available: false,
                is_running: false,
                message: "Cannot connect to OpenAI API".to_string(),
                version: None,
            }),
        }
    }

    async fn start(&mut self) -> Result<()> {
        // Cloud providers don't need to be started
        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        // Cloud providers don't need to be stopped
        Ok(())
    }

    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse> {
        let mut messages = vec![];

        if let Some(system_msg) = request.system_message {
            messages.push(json!({
                "role": "system",
                "content": system_msg
            }));
        }

        messages.push(json!({
            "role": "user",
            "content": request.prompt
        }));

        let body = json!({
            "model": self.credentials.model_name,
            "messages": messages,
            "max_tokens": request.max_tokens.unwrap_or(1000),
            "temperature": request.temperature.unwrap_or(0.7),
        });

        let url = format!("{}/chat/completions", self.credentials.base_url);
        let response = self.client.post(&url)
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("OpenAI API error: {}", error_text));
        }

        let response_json: serde_json::Value = response.json().await?;

        let text = response_json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?
            .to_string();

        let tokens_used = response_json["usage"]["total_tokens"]
            .as_u64()
            .map(|t| t as u32);

        Ok(GenerateResponse {
            text,
            model: self.credentials.model_name.clone(),
            finish_reason: response_json["choices"][0]["finish_reason"]
                .as_str()
                .map(String::from),
            tokens_used,
        })
    }

    async fn test_connection(&self) -> Result<bool> {
        let url = format!("{}/models", self.credentials.base_url);
        let response = self.client.get(&url).send().await?;
        Ok(response.status().is_success())
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        let url = format!("{}/models", self.credentials.base_url);
        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Failed to list models"));
        }

        let response_json: serde_json::Value = response.json().await?;
        let models = response_json["data"]
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?
            .iter()
            .filter_map(|m| m["id"].as_str().map(String::from))
            .collect();

        Ok(models)
    }
}

/// Anthropic (Claude) provider implementation
#[derive(Clone)]
pub struct AnthropicProvider {
    credentials: CloudCredentials,
    client: Client,
}

impl AnthropicProvider {
    pub fn new(credentials: CloudCredentials) -> Self {
        let mut headers = header::HeaderMap::new();
        headers.insert(
            "x-api-key",
            header::HeaderValue::from_str(&credentials.api_key)
                .expect("Invalid API key"),
        );
        headers.insert(
            "anthropic-version",
            header::HeaderValue::from_static("2023-06-01"),
        );

        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .default_headers(headers)
            .build()
            .expect("Failed to create HTTP client");

        Self { credentials, client }
    }
}

#[async_trait]
impl LLMProvider for AnthropicProvider {
    fn provider_type(&self) -> ProviderType {
        ProviderType::CloudAnthropic
    }

    async fn check_status(&self) -> Result<ProviderStatus> {
        match self.test_connection().await {
            Ok(true) => Ok(ProviderStatus {
                is_available: true,
                is_running: true,
                message: "Anthropic API is accessible".to_string(),
                version: Some("2023-06-01".to_string()),
            }),
            Ok(false) | Err(_) => Ok(ProviderStatus {
                is_available: false,
                is_running: false,
                message: "Cannot connect to Anthropic API".to_string(),
                version: None,
            }),
        }
    }

    async fn start(&mut self) -> Result<()> {
        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        Ok(())
    }

    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse> {
        let body = json!({
            "model": self.credentials.model_name,
            "max_tokens": request.max_tokens.unwrap_or(1000),
            "temperature": request.temperature.unwrap_or(0.7),
            "messages": [
                {
                    "role": "user",
                    "content": request.prompt
                }
            ],
            "system": request.system_message.unwrap_or_default(),
        });

        let url = format!("{}/messages", self.credentials.base_url);
        let response = self.client.post(&url)
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Anthropic API error: {}", error_text));
        }

        let response_json: serde_json::Value = response.json().await?;

        let text = response_json["content"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?
            .to_string();

        let tokens_used = response_json["usage"]["total_tokens"]
            .as_u64()
            .map(|t| t as u32);

        Ok(GenerateResponse {
            text,
            model: self.credentials.model_name.clone(),
            finish_reason: response_json["stop_reason"]
                .as_str()
                .map(String::from),
            tokens_used,
        })
    }

    async fn test_connection(&self) -> Result<bool> {
        // Anthropic doesn't have a simple endpoint to test, so we'll try a minimal request
        let body = json!({
            "model": self.credentials.model_name,
            "max_tokens": 1,
            "messages": [{"role": "user", "content": "Hi"}]
        });

        let url = format!("{}/messages", self.credentials.base_url);
        let response = self.client.post(&url).json(&body).send().await?;
        Ok(response.status().is_success())
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        // Anthropic doesn't provide a models list endpoint, return hardcoded list
        Ok(vec![
            "claude-3-5-sonnet-20241022".to_string(),
            "claude-3-5-haiku-20241022".to_string(),
            "claude-3-opus-20240229".to_string(),
            "claude-3-sonnet-20240229".to_string(),
            "claude-3-haiku-20240307".to_string(),
        ])
    }
}

/// Custom/Generic OpenAI-compatible provider (for local servers, etc.)
#[derive(Clone)]
pub struct CustomProvider {
    credentials: CloudCredentials,
    client: Client,
}

impl CustomProvider {
    pub fn new(credentials: CloudCredentials) -> Self {
        let mut headers = header::HeaderMap::new();

        // Only add auth header if API key is provided
        if !credentials.api_key.is_empty() {
            headers.insert(
                header::AUTHORIZATION,
                header::HeaderValue::from_str(&format!("Bearer {}", credentials.api_key))
                    .expect("Invalid API key"),
            );
        }

        let client = Client::builder()
            .timeout(Duration::from_secs(120))
            .default_headers(headers)
            .build()
            .expect("Failed to create HTTP client");

        Self { credentials, client }
    }
}

#[async_trait]
impl LLMProvider for CustomProvider {
    fn provider_type(&self) -> ProviderType {
        ProviderType::CloudCustom
    }

    async fn check_status(&self) -> Result<ProviderStatus> {
        match self.test_connection().await {
            Ok(true) => Ok(ProviderStatus {
                is_available: true,
                is_running: true,
                message: format!("Custom endpoint {} is accessible", self.credentials.base_url),
                version: Some("custom".to_string()),
            }),
            Ok(false) | Err(_) => Ok(ProviderStatus {
                is_available: false,
                is_running: false,
                message: format!("Cannot connect to {}", self.credentials.base_url),
                version: None,
            }),
        }
    }

    async fn start(&mut self) -> Result<()> {
        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        Ok(())
    }

    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse> {
        // Use OpenAI-compatible format
        let mut messages = vec![];

        if let Some(system_msg) = request.system_message {
            messages.push(json!({
                "role": "system",
                "content": system_msg
            }));
        }

        messages.push(json!({
            "role": "user",
            "content": request.prompt
        }));

        let body = json!({
            "model": self.credentials.model_name,
            "messages": messages,
            "max_tokens": request.max_tokens.unwrap_or(1000),
            "temperature": request.temperature.unwrap_or(0.7),
        });

        let url = format!("{}/chat/completions", self.credentials.base_url);
        let response = self.client.post(&url)
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("API error: {}", error_text));
        }

        let response_json: serde_json::Value = response.json().await?;

        let text = response_json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?
            .to_string();

        let tokens_used = response_json.get("usage")
            .and_then(|u| u.get("total_tokens"))
            .and_then(|t| t.as_u64())
            .map(|t| t as u32);

        Ok(GenerateResponse {
            text,
            model: self.credentials.model_name.clone(),
            finish_reason: response_json["choices"][0].get("finish_reason")
                .and_then(|f| f.as_str())
                .map(String::from),
            tokens_used,
        })
    }

    async fn test_connection(&self) -> Result<bool> {
        let url = format!("{}/models", self.credentials.base_url);
        let response = self.client.get(&url).send().await?;
        Ok(response.status().is_success())
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        let url = format!("{}/models", self.credentials.base_url);
        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            return Ok(vec![self.credentials.model_name.clone()]);
        }

        let response_json: serde_json::Value = response.json().await?;
        let models = response_json["data"]
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?
            .iter()
            .filter_map(|m| m["id"].as_str().map(String::from))
            .collect();

        Ok(models)
    }
}
