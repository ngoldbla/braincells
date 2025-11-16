pub mod models;
pub mod operations;

use anyhow::Result;
use duckdb::{Connection, params};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// Database wrapper for managing DuckDB connection
pub struct Database {
    conn: Arc<Mutex<Connection>>,
    db_path: PathBuf,
}

impl Database {
    /// Create a new database instance
    pub fn new(db_path: PathBuf) -> Result<Self> {
        // Create parent directory if it doesn't exist
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(&db_path)
            .map_err(|e| anyhow::anyhow!("Failed to open database at {:?}: {}", db_path, e))?;

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path,
        };

        // Initialize schema
        db.init_schema()?;

        Ok(db)
    }

    /// Initialize database schema
    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        // Create datasets table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            params![],
        )?;

        // Create columns table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS columns (
                id TEXT PRIMARY KEY,
                dataset_id TEXT NOT NULL,
                name TEXT NOT NULL,
                column_type TEXT NOT NULL,
                prompt TEXT,
                provider_id TEXT,
                position INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
            )",
            params![],
        )?;

        // Create cells table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS cells (
                id TEXT PRIMARY KEY,
                dataset_id TEXT NOT NULL,
                column_id TEXT NOT NULL,
                row_index INTEGER NOT NULL,
                value TEXT,
                status TEXT DEFAULT 'pending',
                error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
                FOREIGN KEY(column_id) REFERENCES columns(id) ON DELETE CASCADE,
                UNIQUE(dataset_id, column_id, row_index)
            )",
            params![],
        )?;

        // Create indexes for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_columns_dataset
             ON columns(dataset_id)",
            params![],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_cells_dataset
             ON cells(dataset_id)",
            params![],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_cells_column
             ON cells(column_id)",
            params![],
        )?;

        Ok(())
    }

    /// Get a reference to the database connection
    pub fn conn(&self) -> Arc<Mutex<Connection>> {
        self.conn.clone()
    }

    /// Get the database path
    pub fn path(&self) -> &PathBuf {
        &self.db_path
    }

    /// Execute a raw SQL query (for advanced operations)
    pub fn execute(&self, sql: &str, params: &[&dyn duckdb::ToSql]) -> Result<usize> {
        let conn = self.conn.lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

        let rows_affected = conn.execute(sql, params)
            .map_err(|e| anyhow::anyhow!("Failed to execute query: {}", e))?;

        Ok(rows_affected)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_database_creation() {
        let temp_dir = env::temp_dir();
        let db_path = temp_dir.join("test_braincells.db");

        // Remove if exists
        let _ = std::fs::remove_file(&db_path);

        let db = Database::new(db_path.clone()).unwrap();

        assert!(db_path.exists());

        // Verify tables were created
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").unwrap();
        let tables: Vec<String> = stmt.query_map(params![], |row| row.get(0)).unwrap()
            .filter_map(Result::ok)
            .collect();

        assert!(tables.contains(&"datasets".to_string()));
        assert!(tables.contains(&"columns".to_string()));
        assert!(tables.contains(&"cells".to_string()));

        // Cleanup
        drop(stmt);
        drop(conn);
        let _ = std::fs::remove_file(&db_path);
    }
}
