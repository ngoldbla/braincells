mod providers;
mod commands;
mod utils;
mod database;

use commands::*;
use commands::database::DatabaseState;
use database::Database;
use std::sync::{Arc, Mutex};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = utils::paths::get_app_data_dir()?;
            let db_path = app_data_dir.join("braincells.db");

            let db = Database::new(db_path)
                .map_err(|e| format!("Failed to initialize database: {}", e))?;

            app.manage(DatabaseState(Arc::new(Mutex::new(db))));

            Ok(())
        })
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
            // Database commands - Datasets
            database::create_dataset,
            database::list_datasets,
            database::get_dataset,
            database::delete_dataset,
            // Database commands - Columns
            database::add_column,
            database::list_columns,
            database::delete_column,
            // Database commands - Cells
            database::update_cell,
            database::get_column_cells,
            // Database commands - Table Views
            database::get_table_view,
            database::count_rows,
            // Database commands - Import/Export
            database::import_csv,
            database::export_csv,
            // Generator commands
            generator::generate_column_cells,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
