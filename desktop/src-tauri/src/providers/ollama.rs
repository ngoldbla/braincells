use super::*;
use reqwest::Client;
use serde_json::json;
use std::process::{Child, Command, Stdio};
use std::time::Duration;
use tokio::time::sleep;

/// Ollama local provider implementation
pub struct OllamaProvider {
    config: LocalLLMConfig,
    client: Client,
    process: Option<Child>,
}

impl OllamaProvider {
    pub fn new(config: LocalLLMConfig) -> Result<Self> {
        let client = Client::builder()
            .timeout(Duration::from_secs(300)) // Longer timeout for local models
            .build()
            .map_err(|e| anyhow::anyhow!("Failed to create HTTP client: {}", e))?;

        Ok(Self {
            config,
            client,
            process: None,
        })
    }

    async fn wait_for_ready(&self, max_attempts: u32) -> Result<()> {
        for i in 0..max_attempts {
            if let Ok(status) = self.check_status().await {
                if status.is_running {
                    return Ok(());
                }
            }
            sleep(Duration::from_secs(1)).await;

            // Log progress every 5 attempts using proper logging
            if i % 5 == 0 {
                eprintln!("Ollama startup: attempt {}/{}", i + 1, max_attempts);
            }
        }
        Err(anyhow::anyhow!("Ollama failed to start within {} attempts", max_attempts))
    }

    fn get_base_url(&self) -> String {
        format!("http://localhost:{}", self.config.port)
    }

    /// Pull a model from Ollama registry
    pub async fn pull_model(&self, model_name: &str) -> Result<()> {
        let url = format!("{}/api/pull", self.get_base_url());
        let body = json!({
            "name": model_name
        });

        let response = self.client.post(&url)
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Failed to pull model: {}", error_text));
        }

        Ok(())
    }

    /// Check if Ollama binary exists in system
    pub fn check_ollama_installed() -> Result<bool> {
        let result = Command::new("ollama")
            .arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();

        Ok(result.is_ok())
    }
}

#[async_trait]
impl LLMProvider for OllamaProvider {
    fn provider_type(&self) -> ProviderType {
        ProviderType::LocalOllama
    }

    async fn check_status(&self) -> Result<ProviderStatus> {
        let url = format!("{}/api/tags", self.get_base_url());

        match self.client.get(&url).send().await {
            Ok(response) if response.status().is_success() => {
                Ok(ProviderStatus {
                    is_available: true,
                    is_running: true,
                    message: "Ollama is running".to_string(),
                    version: Some("latest".to_string()),
                })
            }
            _ => {
                Ok(ProviderStatus {
                    is_available: Self::check_ollama_installed().unwrap_or(false),
                    is_running: false,
                    message: "Ollama is not running".to_string(),
                    version: None,
                })
            }
        }
    }

    async fn start(&mut self) -> Result<()> {
        // Check if already running
        if let Ok(status) = self.check_status().await {
            if status.is_running {
                return Ok(());
            }
        }

        // Check if Ollama is installed
        if !Self::check_ollama_installed()? {
            return Err(anyhow::anyhow!(
                "Ollama is not installed. Please install it from https://ollama.ai"
            ));
        }

        // Start Ollama as a subprocess
        let mut cmd = Command::new("ollama");
        cmd.arg("serve");

        // Set environment variables for configuration
        cmd.env("OLLAMA_HOST", format!("127.0.0.1:{}", self.config.port));

        if !self.config.gpu_enabled {
            cmd.env("OLLAMA_NUM_GPU", "0");
        }

        // Redirect output to null to avoid cluttering
        cmd.stdout(Stdio::null());
        cmd.stderr(Stdio::null());

        let child = cmd.spawn()
            .map_err(|e| anyhow::anyhow!("Failed to start Ollama: {}", e))?;

        self.process = Some(child);

        // Wait for Ollama to be ready
        self.wait_for_ready(30).await?;

        Ok(())
    }

    async fn stop(&mut self) -> Result<()> {
        if let Some(mut child) = self.process.take() {
            child.kill()
                .map_err(|e| anyhow::anyhow!("Failed to kill Ollama process: {}", e))?;
            child.wait()
                .map_err(|e| anyhow::anyhow!("Failed to wait for Ollama process: {}", e))?;
        }
        Ok(())
    }

    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse> {
        let model = self.config.model_path.clone()
            .unwrap_or_else(|| "llama3.3".to_string());

        let mut prompt = request.prompt.clone();
        if let Some(system_msg) = request.system_message {
            prompt = format!("{}\n\nUser: {}", system_msg, prompt);
        }

        let body = json!({
            "model": model,
            "prompt": prompt,
            "stream": false,
            "options": {
                "temperature": request.temperature.unwrap_or(0.7),
                "num_predict": request.max_tokens.unwrap_or(1000),
            }
        });

        let url = format!("{}/api/generate", self.get_base_url());
        let response = self.client.post(&url)
            .json(&body)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Ollama API error: {}", error_text));
        }

        let response_json: serde_json::Value = response.json().await?;

        let text = response_json["response"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?
            .to_string();

        Ok(GenerateResponse {
            text,
            model: model.clone(),
            finish_reason: Some("stop".to_string()),
            tokens_used: response_json.get("eval_count")
                .and_then(|v| v.as_u64())
                .map(|v| v as u32),
        })
    }

    async fn test_connection(&self) -> Result<bool> {
        let url = format!("{}/api/tags", self.get_base_url());
        let response = self.client.get(&url).send().await?;
        Ok(response.status().is_success())
    }

    async fn list_models(&self) -> Result<Vec<String>> {
        let url = format!("{}/api/tags", self.get_base_url());
        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            return Ok(vec![]);
        }

        let response_json: serde_json::Value = response.json().await?;
        let models = response_json["models"]
            .as_array()
            .ok_or_else(|| anyhow::anyhow!("Invalid response format"))?
            .iter()
            .filter_map(|m| m["name"].as_str().map(String::from))
            .collect();

        Ok(models)
    }
}

impl Drop for OllamaProvider {
    fn drop(&mut self) {
        // Don't kill the process on drop - let it continue running
        // Users can manually stop it if needed
        let _ = self.process.take();
    }
}
