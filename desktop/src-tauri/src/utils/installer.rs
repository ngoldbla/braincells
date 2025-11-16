use super::paths::*;
use anyhow::Result;
use std::path::PathBuf;
use std::process::Command;

/// Check if Ollama is installed on the system
pub fn is_ollama_installed() -> bool {
    Command::new("ollama")
        .arg("--version")
        .output()
        .is_ok()
}

/// Get the version of installed Ollama
pub fn get_ollama_version() -> Option<String> {
    let output = Command::new("ollama")
        .arg("--version")
        .output()
        .ok()?;

    String::from_utf8(output.stdout)
        .ok()
        .map(|s| s.trim().to_string())
}

/// Installation status
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum InstallStatus {
    NotInstalled,
    Installing,
    Installed { version: String },
    Failed { error: String },
}

/// Download and install Ollama
pub async fn install_ollama() -> Result<PathBuf> {
    #[cfg(target_os = "linux")]
    {
        // On Linux, we'll use the official install script
        let output = Command::new("sh")
            .arg("-c")
            .arg("curl -fsSL https://ollama.ai/install.sh | sh")
            .output()?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow::anyhow!("Failed to install Ollama: {}", error));
        }

        // Ollama should now be in PATH
        Ok(PathBuf::from("/usr/local/bin/ollama"))
    }

    #[cfg(target_os = "macos")]
    {
        // On macOS, download and extract the app
        let url = get_ollama_download_url()?;
        let install_path = get_ollama_install_path()?;

        // Download the zip file
        let response = reqwest::get(&url).await?;
        let bytes = response.bytes().await?;

        // Save to temp file
        let temp_file = std::env::temp_dir().join("ollama.zip");
        std::fs::write(&temp_file, bytes)?;

        // Extract (this is simplified - you'd want to use a proper zip library)
        let output = Command::new("unzip")
            .arg("-o")
            .arg(&temp_file)
            .arg("-d")
            .arg(&install_path)
            .output()?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Failed to extract Ollama"));
        }

        std::fs::remove_file(temp_file)?;

        Ok(install_path.join("Ollama.app").join("Contents").join("MacOS").join("ollama"))
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, download the installer and run it
        let url = get_ollama_download_url()?;
        let temp_file = std::env::temp_dir().join("OllamaSetup.exe");

        // Download the installer
        let response = reqwest::get(&url).await?;
        let bytes = response.bytes().await?;
        std::fs::write(&temp_file, bytes)?;

        // Run the installer
        let output = Command::new(&temp_file)
            .arg("/S") // Silent install
            .output()?;

        if !output.status.success() {
            return Err(anyhow::anyhow!("Failed to install Ollama"));
        }

        std::fs::remove_file(temp_file)?;

        // Ollama is typically installed to Program Files
        Ok(PathBuf::from("C:\\Program Files\\Ollama\\ollama.exe"))
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err(anyhow::anyhow!("Unsupported platform for automatic Ollama installation"))
    }
}

/// Check system requirements for running local LLMs
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SystemRequirements {
    pub total_memory_gb: f64,
    pub available_memory_gb: f64,
    pub has_gpu: bool,
    pub gpu_name: Option<String>,
    pub disk_space_gb: f64,
    pub meets_requirements: bool,
}

impl SystemRequirements {
    pub fn check() -> Self {
        // Get system memory (simplified - would need platform-specific code)
        let total_memory_gb = Self::get_total_memory_gb();
        let available_memory_gb = Self::get_available_memory_gb();
        let disk_space_gb = Self::get_available_disk_space_gb();

        // Check for GPU (simplified)
        let (has_gpu, gpu_name) = Self::detect_gpu();

        // Minimum requirements: 8GB RAM, 20GB disk space
        let meets_requirements = total_memory_gb >= 8.0 && disk_space_gb >= 20.0;

        Self {
            total_memory_gb,
            available_memory_gb,
            has_gpu,
            gpu_name,
            disk_space_gb,
            meets_requirements,
        }
    }

    fn get_total_memory_gb() -> f64 {
        // Simplified - would use platform-specific APIs
        #[cfg(target_os = "linux")]
        {
            if let Ok(meminfo) = std::fs::read_to_string("/proc/meminfo") {
                for line in meminfo.lines() {
                    if line.starts_with("MemTotal:") {
                        if let Some(kb) = line.split_whitespace().nth(1) {
                            if let Ok(kb_value) = kb.parse::<f64>() {
                                return kb_value / 1024.0 / 1024.0; // Convert to GB
                            }
                        }
                    }
                }
            }
        }

        16.0 // Default fallback
    }

    fn get_available_memory_gb() -> f64 {
        // Simplified - would use platform-specific APIs
        Self::get_total_memory_gb() * 0.7 // Assume 70% available
    }

    fn get_available_disk_space_gb() -> f64 {
        // Simplified - would use platform-specific APIs
        100.0 // Default fallback
    }

    fn detect_gpu() -> (bool, Option<String>) {
        // Try to detect NVIDIA GPU
        #[cfg(target_os = "linux")]
        {
            if let Ok(output) = Command::new("nvidia-smi")
                .arg("--query-gpu=name")
                .arg("--format=csv,noheader")
                .output()
            {
                if output.status.success() {
                    let gpu_name = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !gpu_name.is_empty() {
                        return (true, Some(gpu_name));
                    }
                }
            }
        }

        (false, None)
    }
}
