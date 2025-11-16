use std::path::PathBuf;
use anyhow::Result;

/// Get the application data directory for Brain Cells
pub fn get_app_data_dir() -> Result<PathBuf> {
    let dir = dirs::data_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not determine data directory"))?
        .join("BrainCells");

    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Get the application config directory
pub fn get_app_config_dir() -> Result<PathBuf> {
    let dir = dirs::config_dir()
        .ok_or_else(|| anyhow::anyhow!("Could not determine config directory"))?
        .join("BrainCells");

    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Get the directory where local LLM binaries are stored
pub fn get_llm_binaries_dir() -> Result<PathBuf> {
    let dir = get_app_data_dir()?.join("llm_binaries");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Get the Ollama installation path
pub fn get_ollama_install_path() -> Result<PathBuf> {
    Ok(get_llm_binaries_dir()?.join("ollama"))
}

/// Get the models directory for local storage
pub fn get_models_dir() -> Result<PathBuf> {
    let dir = get_app_data_dir()?.join("models");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Get the database directory
pub fn get_database_dir() -> Result<PathBuf> {
    let dir = get_app_data_dir()?.join("database");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Get the logs directory
pub fn get_logs_dir() -> Result<PathBuf> {
    let dir = get_app_data_dir()?.join("logs");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

/// Get platform-specific Ollama download URL
pub fn get_ollama_download_url() -> Result<String> {
    #[cfg(target_os = "windows")]
    return Ok("https://ollama.ai/download/OllamaSetup.exe".to_string());

    #[cfg(target_os = "macos")]
    {
        #[cfg(target_arch = "aarch64")]
        return Ok("https://ollama.ai/download/Ollama-darwin-arm64.zip".to_string());

        #[cfg(target_arch = "x86_64")]
        return Ok("https://ollama.ai/download/Ollama-darwin-x86_64.zip".to_string());
    }

    #[cfg(target_os = "linux")]
    return Ok("https://ollama.ai/install.sh".to_string());

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    return Err(anyhow::anyhow!("Unsupported platform for Ollama installation"));
}

/// Get the current platform name
pub fn get_platform_name() -> &'static str {
    #[cfg(target_os = "windows")]
    return "windows";

    #[cfg(target_os = "macos")]
    return "macos";

    #[cfg(target_os = "linux")]
    return "linux";

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    return "unknown";
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_app_data_dir() {
        let dir = get_app_data_dir().unwrap();
        assert!(dir.to_string_lossy().contains("BrainCells"));
    }

    #[test]
    fn test_platform_name() {
        let platform = get_platform_name();
        assert!(["windows", "macos", "linux", "unknown"].contains(&platform));
    }
}
