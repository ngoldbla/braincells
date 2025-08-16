use tauri::Manager;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AppSettings {
    // Ollama settings
    ollama_enabled: bool,
    ollama_endpoint: String,
    ollama_model: String,
    
    // Hugging Face settings
    hf_token: Option<String>,
    hf_endpoint: Option<String>,
    
    // Embedding settings
    embedding_provider: String, // "ollama", "huggingface", or "transformers"
    embedding_model: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            ollama_enabled: false,
            ollama_endpoint: "http://localhost:11434".to_string(),
            ollama_model: "llama3.2".to_string(),
            hf_token: None,
            hf_endpoint: None,
            embedding_provider: "transformers".to_string(),
            embedding_model: "Xenova/all-MiniLM-L6-v2".to_string(),
        }
    }
}

// Get the settings file path
fn get_settings_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let app_dir = app_handle.path()
        .app_config_dir()
        .expect("Failed to get app config dir");
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&app_dir).ok();
    
    app_dir.join("settings.json")
}

// Command to save settings
#[tauri::command]
fn save_settings(app_handle: tauri::AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path(&app_handle);
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    
    fs::write(path, json)
        .map_err(|e| format!("Failed to write settings: {}", e))?;
    
    // Update environment variables for the current process
    if settings.ollama_enabled {
        std::env::set_var("MODEL_ENDPOINT_URL", format!("{}/api/generate", &settings.ollama_endpoint));
        std::env::set_var("DEFAULT_MODEL", &settings.ollama_model);
        std::env::set_var("EMBEDDING_MODEL_PROVIDER", "ollama");
        std::env::set_var("EMBEDDING_ENDPOINT_URL", format!("{}/api/embeddings", &settings.ollama_endpoint));
    }
    
    if let Some(token) = &settings.hf_token {
        if !token.is_empty() {
            std::env::set_var("HF_TOKEN", token);
        }
    }
    
    log::info!("Settings saved successfully");
    Ok(())
}

// Command to load settings
#[tauri::command]
fn load_settings(app_handle: tauri::AppHandle) -> AppSettings {
    let path = get_settings_path(&app_handle);
    
    if path.exists() {
        if let Ok(json) = fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str::<AppSettings>(&json) {
                // Apply settings to environment
                if settings.ollama_enabled {
                    std::env::set_var("MODEL_ENDPOINT_URL", format!("{}/api/generate", &settings.ollama_endpoint));
                    std::env::set_var("DEFAULT_MODEL", &settings.ollama_model);
                    std::env::set_var("EMBEDDING_ENDPOINT_URL", format!("{}/api/embeddings", &settings.ollama_endpoint));
                }
                
                if let Some(token) = &settings.hf_token {
                    if !token.is_empty() {
                        std::env::set_var("HF_TOKEN", token);
                    }
                }
                
                return settings;
            }
        }
    }
    
    AppSettings::default()
}

// Command to test Ollama connection
#[tauri::command]
async fn test_ollama_connection(endpoint: String) -> Result<bool, String> {
    let url = format!("{}/api/tags", endpoint);
    log::info!("Testing Ollama connection at: {}", url);
    
    // For now, just check if we can construct the URL
    // TODO: Add actual HTTP request when reqwest is added
    Ok(!endpoint.is_empty())
}

// Sample command to demonstrate Tauri integration
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Welcome to Brain Cells, {}!", name)
}

// Command to get system info
#[tauri::command]
fn get_system_info() -> serde_json::Value {
    serde_json::json!({
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "version": env!("CARGO_PKG_VERSION"),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Log application startup
      log::info!("Brain Cells application started");
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        greet,
        get_system_info,
        save_settings,
        load_settings,
        test_ollama_connection
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
