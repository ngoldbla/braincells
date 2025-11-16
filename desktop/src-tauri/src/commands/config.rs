use crate::utils::*;
use std::path::PathBuf;

/// Get the application data directory
#[tauri::command]
pub fn get_app_data_directory() -> Result<PathBuf, String> {
    get_app_data_dir().map_err(|e| e.to_string())
}

/// Get the application config directory
#[tauri::command]
pub fn get_app_config_directory() -> Result<PathBuf, String> {
    get_app_config_dir().map_err(|e| e.to_string())
}

/// Get the models directory
#[tauri::command]
pub fn get_models_directory() -> Result<PathBuf, String> {
    get_models_dir().map_err(|e| e.to_string())
}

/// Get the database directory
#[tauri::command]
pub fn get_database_directory() -> Result<PathBuf, String> {
    get_database_dir().map_err(|e| e.to_string())
}

/// Get the current platform name
#[tauri::command]
pub fn get_platform() -> String {
    get_platform_name().to_string()
}

/// Get Ollama download URL for current platform
#[tauri::command]
pub fn get_ollama_download_url_cmd() -> Result<String, String> {
    get_ollama_download_url().map_err(|e| e.to_string())
}
