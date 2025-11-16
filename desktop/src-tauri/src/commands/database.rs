use crate::database::{models::*, Database};
use anyhow::Result;
use std::sync::{Arc, Mutex};
use tauri::State;

/// State wrapper for database
pub struct DatabaseState(pub Arc<Mutex<Database>>);

// ==================== DATASET COMMANDS ====================

#[tauri::command]
pub async fn create_dataset(
    name: String,
    description: Option<String>,
    db: State<'_, DatabaseState>,
) -> Result<Dataset, String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.create_dataset(name, description)
        .map_err(|e| format!("Failed to create dataset: {}", e))
}

#[tauri::command]
pub async fn list_datasets(db: State<'_, DatabaseState>) -> Result<Vec<Dataset>, String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.list_datasets()
        .map_err(|e| format!("Failed to list datasets: {}", e))
}

#[tauri::command]
pub async fn get_dataset(
    dataset_id: String,
    db: State<'_, DatabaseState>,
) -> Result<Option<Dataset>, String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.get_dataset(&dataset_id)
        .map_err(|e| format!("Failed to get dataset: {}", e))
}

#[tauri::command]
pub async fn delete_dataset(
    dataset_id: String,
    db: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.delete_dataset(&dataset_id)
        .map_err(|e| format!("Failed to delete dataset: {}", e))
}

// ==================== COLUMN COMMANDS ====================

#[tauri::command]
pub async fn add_column(
    dataset_id: String,
    name: String,
    column_type: String,
    prompt: Option<String>,
    provider_id: Option<String>,
    position: i32,
    db: State<'_, DatabaseState>,
) -> Result<Column, String> {
    let db_lock = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let col_type = column_type.parse::<ColumnType>()
        .map_err(|e| format!("Invalid column type: {}", e))?;

    let mut column = Column::new(dataset_id, name, col_type, position);

    if let Some(p) = prompt {
        column = column.with_prompt(p);
    }

    if let Some(pid) = provider_id {
        column = column.with_provider(pid);
    }

    db_lock.add_column(column)
        .map_err(|e| format!("Failed to add column: {}", e))
}

#[tauri::command]
pub async fn list_columns(
    dataset_id: String,
    db: State<'_, DatabaseState>,
) -> Result<Vec<Column>, String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.list_columns(&dataset_id)
        .map_err(|e| format!("Failed to list columns: {}", e))
}

#[tauri::command]
pub async fn delete_column(
    column_id: String,
    db: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.delete_column(&column_id)
        .map_err(|e| format!("Failed to delete column: {}", e))
}

// ==================== CELL COMMANDS ====================

#[tauri::command]
pub async fn update_cell(
    dataset_id: String,
    column_id: String,
    row_index: i32,
    value: Option<String>,
    db: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db_lock = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let mut cell = Cell::new(dataset_id, column_id, row_index);

    if let Some(v) = value {
        cell = cell.with_value(v);
    }

    db_lock.upsert_cell(&cell)
        .map_err(|e| format!("Failed to update cell: {}", e))
}

#[tauri::command]
pub async fn get_column_cells(
    column_id: String,
    db: State<'_, DatabaseState>,
) -> Result<Vec<Cell>, String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.get_column_cells(&column_id)
        .map_err(|e| format!("Failed to get column cells: {}", e))
}

// ==================== TABLE VIEW COMMANDS ====================

#[tauri::command]
pub async fn get_table_view(
    dataset_id: String,
    limit: Option<i32>,
    offset: Option<i32>,
    db: State<'_, DatabaseState>,
) -> Result<Option<TableView>, String> {
    let db_lock = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db_lock.get_table_view(&dataset_id, limit, offset)
        .map_err(|e| format!("Failed to get table view: {}", e))
}

#[tauri::command]
pub async fn count_rows(
    dataset_id: String,
    db: State<'_, DatabaseState>,
) -> Result<i32, String> {
    let db = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    db.count_rows(&dataset_id)
        .map_err(|e| format!("Failed to count rows: {}", e))
}

// ==================== IMPORT/EXPORT COMMANDS ====================

#[tauri::command]
pub async fn import_csv(
    dataset_id: String,
    csv_content: String,
    db: State<'_, DatabaseState>,
) -> Result<(), String> {
    let db_lock = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Parse CSV
    let mut reader = csv::Reader::from_reader(csv_content.as_bytes());
    let mut data: Vec<Vec<String>> = Vec::new();

    // Read headers
    if let Ok(headers) = reader.headers() {
        data.push(headers.iter().map(|h| h.to_string()).collect());
    }

    // Read rows
    for result in reader.records() {
        match result {
            Ok(record) => {
                data.push(record.iter().map(|r| r.to_string()).collect());
            }
            Err(e) => return Err(format!("Failed to parse CSV: {}", e)),
        }
    }

    db_lock.import_csv_data(&dataset_id, data)
        .map_err(|e| format!("Failed to import CSV: {}", e))
}

#[tauri::command]
pub async fn export_csv(
    dataset_id: String,
    db: State<'_, DatabaseState>,
) -> Result<String, String> {
    let db_lock = db.0.lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    let table_view = db_lock.get_table_view(&dataset_id, None, None)
        .map_err(|e| format!("Failed to get table view: {}", e))?
        .ok_or_else(|| "Dataset not found".to_string())?;

    // Build CSV
    let mut wtr = csv::Writer::from_writer(vec![]);

    // Write headers
    let headers: Vec<String> = table_view.columns.iter().map(|c| c.name.clone()).collect();
    wtr.write_record(&headers)
        .map_err(|e| format!("Failed to write CSV headers: {}", e))?;

    // Write rows
    for row in &table_view.rows {
        let mut record: Vec<String> = Vec::new();
        for column in &table_view.columns {
            let value = row.get_cell_value(&column.id)
                .map(|v| v.clone())
                .unwrap_or_default();
            record.push(value);
        }
        wtr.write_record(&record)
            .map_err(|e| format!("Failed to write CSV row: {}", e))?;
    }

    let csv_bytes = wtr.into_inner()
        .map_err(|e| format!("Failed to finalize CSV: {}", e))?;

    String::from_utf8(csv_bytes)
        .map_err(|e| format!("Failed to convert CSV to string: {}", e))
}
