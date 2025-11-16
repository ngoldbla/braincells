use crate::utils::installer::*;

/// Check if Ollama is installed
#[tauri::command]
pub fn is_ollama_installed_cmd() -> bool {
    is_ollama_installed()
}

/// Get Ollama version
#[tauri::command]
pub fn get_ollama_version_cmd() -> Option<String> {
    get_ollama_version()
}

/// Install Ollama
#[tauri::command]
pub async fn install_ollama_cmd() -> Result<String, String> {
    install_ollama()
        .await
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

/// Check system requirements
#[tauri::command]
pub fn check_system_requirements() -> SystemRequirements {
    SystemRequirements::check()
}
