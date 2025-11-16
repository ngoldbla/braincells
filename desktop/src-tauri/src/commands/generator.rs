use crate::database::{models::*, Database};
use crate::providers::*;
use anyhow::{anyhow, Result};
use regex::Regex;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::State;

use super::database::DatabaseState;

/// Progress update for cell generation
#[derive(Debug, Clone, serde::Serialize)]
pub struct GenerationProgress {
    pub total: usize,
    pub completed: usize,
    pub failed: usize,
    pub current_row: Option<i32>,
}

/// Generate cells for an Output column using AI
#[tauri::command]
pub async fn generate_column_cells(
    dataset_id: String,
    column_id: String,
    provider_config: ProviderConfig,
    db: State<'_, DatabaseState>,
) -> Result<GenerationProgress, String> {
    // Get initial data in a scoped block to ensure MutexGuard is dropped
    let (prompt_template, total_rows) = {
        let db_lock = db.0.lock()
            .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

        // Get the column
        let columns = db_lock.list_columns(&dataset_id)
            .map_err(|e| format!("Failed to list columns: {}", e))?;

        let column = columns.iter()
            .find(|c| c.id == column_id)
            .ok_or_else(|| "Column not found".to_string())?;

        // Verify it's an Output column
        if column.column_type != ColumnType::Output {
            return Err("Can only generate cells for Output columns".to_string());
        }

        let prompt_template = column.prompt.as_ref()
            .ok_or_else(|| "Output column has no prompt template".to_string())?.clone();

        // Get all rows
        let total_rows = db_lock.count_rows(&dataset_id)
            .map_err(|e| format!("Failed to count rows: {}", e))?;

        if total_rows == 0 {
            return Err("No rows to generate cells for".to_string());
        }

        (prompt_template, total_rows)
    }; // db_lock is dropped here

    // Create the AI provider
    let provider = create_provider(&provider_config)
        .map_err(|e| format!("Failed to create provider: {}", e))?;

    let mut progress = GenerationProgress {
        total: total_rows as usize,
        completed: 0,
        failed: 0,
        current_row: None,
    };

    // Process each row
    for row_index in 0..total_rows {
        progress.current_row = Some(row_index);

        // Get the table view for this specific row to access cell values
        let table_view = {
            let db_lock = db.0.lock()
                .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

            db_lock.get_table_view(&dataset_id, Some(1), Some(row_index))
                .map_err(|e| format!("Failed to get table view: {}", e))?
                .ok_or_else(|| "Failed to get table view".to_string())?
        }; // db_lock is dropped here

        if table_view.rows.is_empty() {
            continue;
        }

        let row = &table_view.rows[0];

        // Materialize the prompt by substituting {{Column Name}} with actual values
        let materialized_prompt = match materialize_prompt(&prompt_template, row, &table_view.columns) {
            Ok(p) => p,
            Err(e) => {
                // Mark cell as error in a scoped block
                {
                    let db_lock = db.0.lock()
                        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

                    let cell = Cell::new(dataset_id.clone(), column_id.clone(), row_index)
                        .with_error(format!("Failed to materialize prompt: {}", e));

                    db_lock.upsert_cell(&cell)
                        .map_err(|e| format!("Failed to update cell: {}", e))?;
                } // db_lock is dropped here
                progress.failed += 1;
                continue;
            }
        };

        // Generate the cell value using AI
        let generated_value = match provider.generate(GenerateRequest {
            prompt: materialized_prompt.clone(),
            max_tokens: Some(500),
            temperature: Some(0.7),
            system_message: None,
        }).await {
            Ok(response) => response.text,
            Err(e) => {
                // Mark cell as error in a scoped block
                {
                    let db_lock = db.0.lock()
                        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

                    let cell = Cell::new(dataset_id.clone(), column_id.clone(), row_index)
                        .with_error(format!("AI generation failed: {}", e));

                    db_lock.upsert_cell(&cell)
                        .map_err(|e| format!("Failed to update cell: {}", e))?;
                } // db_lock is dropped here
                progress.failed += 1;
                continue;
            }
        };

        // Update the cell with the generated value in a scoped block
        {
            let db_lock = db.0.lock()
                .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

            let cell = Cell::new(dataset_id.clone(), column_id.clone(), row_index)
                .with_value(generated_value);

            db_lock.upsert_cell(&cell)
                .map_err(|e| format!("Failed to update cell: {}", e))?;
        } // db_lock is dropped here
        progress.completed += 1;
    }

    progress.current_row = None;
    Ok(progress)
}

/// Materialize a prompt template by replacing {{Column Name}} with actual cell values
fn materialize_prompt(
    template: &str,
    row: &Row,
    columns: &[Column],
) -> Result<String> {
    let re = Regex::new(r"\{\{([^}]+)\}\}")
        .map_err(|e| anyhow!("Failed to compile regex: {}", e))?;

    let mut result = template.to_string();
    let mut missing_columns = Vec::new();

    for cap in re.captures_iter(template) {
        let column_name = cap[1].trim();

        // Find the column by name
        let column = columns.iter()
            .find(|c| c.name == column_name);

        match column {
            Some(col) => {
                // Get the cell value for this column
                let value = row.get_cell_value(&col.id)
                    .map(|v| v.as_str())
                    .unwrap_or("");

                // Replace {{Column Name}} with the actual value
                let pattern = format!("{{{{{}}}}}", column_name);
                result = result.replace(&pattern, value);
            }
            None => {
                missing_columns.push(column_name.to_string());
            }
        }
    }

    if !missing_columns.is_empty() {
        return Err(anyhow!(
            "Referenced columns not found: {}",
            missing_columns.join(", ")
        ));
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_materialize_prompt() {
        let mut row = Row::new(0);
        let mut columns = Vec::new();

        // Create test columns
        let col1 = Column::new("ds1".to_string(), "Product".to_string(), ColumnType::Input, 0);
        let col2 = Column::new("ds1".to_string(), "Category".to_string(), ColumnType::Input, 1);

        columns.push(col1.clone());
        columns.push(col2.clone());

        // Add cells
        let cell1 = Cell::new("ds1".to_string(), col1.id.clone(), 0)
            .with_value("iPhone".to_string());
        let cell2 = Cell::new("ds1".to_string(), col2.id.clone(), 0)
            .with_value("Electronics".to_string());

        row.add_cell(col1.id.clone(), cell1);
        row.add_cell(col2.id.clone(), cell2);

        // Test template
        let template = "Write a description for {{Product}} in the {{Category}} category";
        let result = materialize_prompt(template, &row, &columns).unwrap();

        assert_eq!(result, "Write a description for iPhone in the Electronics category");
    }

    #[test]
    fn test_materialize_prompt_missing_column() {
        let row = Row::new(0);
        let columns = Vec::new();

        let template = "Write a description for {{Product}}";
        let result = materialize_prompt(template, &row, &columns);

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Referenced columns not found"));
    }
}
