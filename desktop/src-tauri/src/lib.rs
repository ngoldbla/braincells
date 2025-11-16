mod providers;
mod commands;
mod utils;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            // LLM commands
            test_cloud_connection,
            check_ollama_status,
            start_ollama,
            pull_ollama_model,
            list_models,
            generate_text,
            check_provider_status,
            // Config commands
            get_app_data_directory,
            get_app_config_directory,
            get_models_directory,
            get_database_directory,
            get_platform,
            get_ollama_download_url_cmd,
            // Process commands
            is_ollama_installed_cmd,
            get_ollama_version_cmd,
            install_ollama_cmd,
            check_system_requirements,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
