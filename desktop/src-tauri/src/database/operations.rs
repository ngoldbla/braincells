use super::models::*;
use super::Database;
use anyhow::Result;
use chrono::{DateTime, Utc};
use duckdb::params;
use std::collections::HashMap;

impl Database {
    // ==================== DATASET OPERATIONS ====================

    /// Create a new dataset
    pub fn create_dataset(&self, name: String, description: Option<String>) -> Result<Dataset> {
        let dataset = Dataset::new(name, description);

        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        conn.execute(
            "INSERT INTO datasets (id, name, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)",
            params![
                &dataset.id,
                &dataset.name,
                &dataset.description,
                &dataset.created_at.to_rfc3339(),
                &dataset.updated_at.to_rfc3339(),
            ],
        )?;

        Ok(dataset)
    }

    /// List all datasets
    pub fn list_datasets(&self) -> Result<Vec<Dataset>> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at
             FROM datasets
             ORDER BY updated_at DESC"
        )?;

        let datasets = stmt.query_map(params![], |row| {
            Ok(Dataset {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get::<_, String>(3)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(3, duckdb::types::Type::Text, Box::new(e)))?,
                updated_at: row.get::<_, String>(4)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(4, duckdb::types::Type::Text, Box::new(e)))?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(datasets)
    }

    /// Get a dataset by ID
    pub fn get_dataset(&self, dataset_id: &str) -> Result<Option<Dataset>> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at
             FROM datasets
             WHERE id = ?"
        )?;

        let result = stmt.query_row(params![dataset_id], |row| {
            Ok(Dataset {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get::<_, String>(3)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(3, duckdb::types::Type::Text, Box::new(e)))?,
                updated_at: row.get::<_, String>(4)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(4, duckdb::types::Type::Text, Box::new(e)))?,
            })
        });

        match result {
            Ok(dataset) => Ok(Some(dataset)),
            Err(duckdb::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    /// Delete a dataset and all associated data
    pub fn delete_dataset(&self, dataset_id: &str) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        conn.execute("DELETE FROM datasets WHERE id = ?", params![dataset_id])?;

        Ok(())
    }

    // ==================== COLUMN OPERATIONS ====================

    /// Add a column to a dataset
    pub fn add_column(&self, column: Column) -> Result<Column> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        conn.execute(
            "INSERT INTO columns (id, dataset_id, name, column_type, prompt, provider_id, position, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                &column.id,
                &column.dataset_id,
                &column.name,
                &column.column_type.to_string(),
                &column.prompt,
                &column.provider_id,
                &column.position,
                &column.created_at.to_rfc3339(),
            ],
        )?;

        Ok(column)
    }

    /// List columns for a dataset
    pub fn list_columns(&self, dataset_id: &str) -> Result<Vec<Column>> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        let mut stmt = conn.prepare(
            "SELECT id, dataset_id, name, column_type, prompt, provider_id, position, created_at
             FROM columns
             WHERE dataset_id = ?
             ORDER BY position"
        )?;

        let columns = stmt.query_map(params![dataset_id], |row| {
            let column_type_str: String = row.get(3)?;
            let column_type = column_type_str.parse::<ColumnType>()
                .map_err(|e| duckdb::Error::FromSqlConversionFailure(
                    3,
                    duckdb::types::Type::Text,
                    Box::new(std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string()))
                ))?;

            Ok(Column {
                id: row.get(0)?,
                dataset_id: row.get(1)?,
                name: row.get(2)?,
                column_type,
                prompt: row.get(4)?,
                provider_id: row.get(5)?,
                position: row.get(6)?,
                created_at: row.get::<_, String>(7)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(7, duckdb::types::Type::Text, Box::new(e)))?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(columns)
    }

    /// Delete a column and all associated cells
    pub fn delete_column(&self, column_id: &str) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        conn.execute("DELETE FROM columns WHERE id = ?", params![column_id])?;

        Ok(())
    }

    // ==================== CELL OPERATIONS ====================

    /// Insert or update a cell
    pub fn upsert_cell(&self, cell: &Cell) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        conn.execute(
            "INSERT OR REPLACE INTO cells
             (id, dataset_id, column_id, row_index, value, status, error, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                &cell.id,
                &cell.dataset_id,
                &cell.column_id,
                &cell.row_index,
                &cell.value,
                &cell.status.to_string(),
                &cell.error,
                &cell.created_at.to_rfc3339(),
                &cell.updated_at.to_rfc3339(),
            ],
        )?;

        Ok(())
    }

    /// Get cells for a specific column
    pub fn get_column_cells(&self, column_id: &str) -> Result<Vec<Cell>> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        let mut stmt = conn.prepare(
            "SELECT id, dataset_id, column_id, row_index, value, status, error, created_at, updated_at
             FROM cells
             WHERE column_id = ?
             ORDER BY row_index"
        )?;

        let cells = stmt.query_map(params![column_id], |row| {
            let status_str: String = row.get(5)?;
            let status = status_str.parse::<CellStatus>()
                .map_err(|e| duckdb::Error::FromSqlConversionFailure(
                    5,
                    duckdb::types::Type::Text,
                    Box::new(std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string()))
                ))?;

            Ok(Cell {
                id: row.get(0)?,
                dataset_id: row.get(1)?,
                column_id: row.get(2)?,
                row_index: row.get(3)?,
                value: row.get(4)?,
                status,
                error: row.get(6)?,
                created_at: row.get::<_, String>(7)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(7, duckdb::types::Type::Text, Box::new(e)))?,
                updated_at: row.get::<_, String>(8)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(8, duckdb::types::Type::Text, Box::new(e)))?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(cells)
    }

    /// Get all rows for a dataset
    pub fn get_dataset_rows(&self, dataset_id: &str, limit: Option<i32>, offset: Option<i32>) -> Result<Vec<Row>> {
        let columns = self.list_columns(dataset_id)?;

        if columns.is_empty() {
            return Ok(Vec::new());
        }

        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        // Get all cells for this dataset
        let mut stmt = conn.prepare(
            "SELECT id, dataset_id, column_id, row_index, value, status, error, created_at, updated_at
             FROM cells
             WHERE dataset_id = ?
             ORDER BY row_index, column_id"
        )?;

        let cells: Vec<Cell> = stmt.query_map(params![dataset_id], |row| {
            let status_str: String = row.get(5)?;
            let status = status_str.parse::<CellStatus>()
                .map_err(|e| duckdb::Error::FromSqlConversionFailure(
                    5,
                    duckdb::types::Type::Text,
                    Box::new(std::io::Error::new(std::io::ErrorKind::InvalidData, e.to_string()))
                ))?;

            Ok(Cell {
                id: row.get(0)?,
                dataset_id: row.get(1)?,
                column_id: row.get(2)?,
                row_index: row.get(3)?,
                value: row.get(4)?,
                status,
                error: row.get(6)?,
                created_at: row.get::<_, String>(7)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(7, duckdb::types::Type::Text, Box::new(e)))?,
                updated_at: row.get::<_, String>(8)?.parse::<DateTime<Utc>>()
                    .map_err(|e| duckdb::Error::FromSqlConversionFailure(8, duckdb::types::Type::Text, Box::new(e)))?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        // Group cells by row_index
        let mut rows_map: HashMap<i32, Row> = HashMap::new();

        for cell in cells {
            let row = rows_map.entry(cell.row_index).or_insert_with(|| Row::new(cell.row_index));
            row.add_cell(cell.column_id.clone(), cell);
        }

        // Convert to sorted vector
        let mut rows: Vec<Row> = rows_map.into_values().collect();
        rows.sort_by_key(|r| r.index);

        // Apply pagination
        let offset = offset.unwrap_or(0) as usize;
        let rows: Vec<Row> = if let Some(limit) = limit {
            rows.into_iter().skip(offset).take(limit as usize).collect()
        } else {
            rows.into_iter().skip(offset).collect()
        };

        Ok(rows)
    }

    /// Get table view for a dataset
    pub fn get_table_view(&self, dataset_id: &str, limit: Option<i32>, offset: Option<i32>) -> Result<Option<TableView>> {
        let dataset = match self.get_dataset(dataset_id)? {
            Some(ds) => ds,
            None => return Ok(None),
        };

        let columns = self.list_columns(dataset_id)?;
        let rows = self.get_dataset_rows(dataset_id, limit, offset)?;

        Ok(Some(TableView::new(dataset, columns, rows)))
    }

    /// Count rows in a dataset
    pub fn count_rows(&self, dataset_id: &str) -> Result<i32> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        let count: i32 = conn.query_row(
            "SELECT COUNT(DISTINCT row_index) FROM cells WHERE dataset_id = ?",
            params![dataset_id],
            |row| row.get(0),
        )?;

        Ok(count)
    }

    /// Import CSV data into a dataset
    pub fn import_csv_data(&self, dataset_id: &str, csv_data: Vec<Vec<String>>) -> Result<()> {
        if csv_data.is_empty() {
            return Err(anyhow::anyhow!("CSV data is empty"));
        }

        // First row is headers
        let headers = &csv_data[0];
        let rows = &csv_data[1..];

        // Create columns for each header
        for (pos, header) in headers.iter().enumerate() {
            let column = Column::new(
                dataset_id.to_string(),
                header.clone(),
                ColumnType::Input,
                pos as i32,
            );
            self.add_column(column)?;
        }

        // Get the created columns
        let columns = self.list_columns(dataset_id)?;

        // Insert cells
        for (row_idx, row_data) in rows.iter().enumerate() {
            for (col_idx, value) in row_data.iter().enumerate() {
                if let Some(column) = columns.get(col_idx) {
                    let cell = Cell::new(
                        dataset_id.to_string(),
                        column.id.clone(),
                        row_idx as i32,
                    ).with_value(value.clone());

                    self.upsert_cell(&cell)?;
                }
            }
        }

        Ok(())
    }
}
