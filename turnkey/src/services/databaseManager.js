const path = require('path');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const duckdb = require('duckdb');

class DatabaseManager {
  constructor(options) {
    this.dataDir = options.dataDir;
    this.isDev = options.isDev;
    this.sqliteDb = null;
    this.duckDb = null;
    this.environment = this.isDev ? 'development' : 'production';
  }

  async initialize() {
    try {
      // Create data directories
      await this.createDirectories();
      
      // Initialize SQLite database
      await this.initializeSQLite();
      
      // Initialize DuckDB database
      await this.initializeDuckDB();
      
      console.log('Databases initialized successfully');
    } catch (error) {
      console.error('Failed to initialize databases:', error);
      throw error;
    }
  }

  async createDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, this.environment),
      path.join(this.dataDir, this.environment, 'duckdb'),
      path.join(this.dataDir, this.environment, 'embeddings'),
      path.join(this.dataDir, this.environment, 'uploads'),
      path.join(this.dataDir, this.environment, 'exports')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async initializeSQLite() {
    const dbPath = path.join(this.dataDir, this.environment, '.sqlite3');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Failed to open SQLite database:', err);
          reject(err);
        } else {
          console.log('SQLite database connected');
          
          // Enable foreign keys
          this.sqliteDb.run('PRAGMA foreign_keys = ON');
          
          // Set journal mode to WAL for better concurrency
          this.sqliteDb.run('PRAGMA journal_mode = WAL');
          
          resolve();
        }
      });
    });
  }

  async initializeDuckDB() {
    const dbPath = path.join(this.dataDir, this.environment, 'duckdb', 'braincells.duckdb');
    
    return new Promise((resolve, reject) => {
      this.duckDb = new duckdb.Database(dbPath, (err) => {
        if (err) {
          console.error('Failed to open DuckDB database:', err);
          reject(err);
        } else {
          console.log('DuckDB database connected');
          resolve();
        }
      });
    });
  }

  async runMigrations() {
    try {
      // Create initial tables if they don't exist
      await this.createInitialTables();
      
      // Run any pending migrations
      // This would normally check a migrations table and run scripts
      
      console.log('Database migrations completed');
    } catch (error) {
      console.error('Failed to run migrations:', error);
      throw error;
    }
  }

  async createInitialTables() {
    // Create datasets table
    const createDatasetsTable = `
      CREATE TABLE IF NOT EXISTS datasets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'spreadsheet',
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create columns table
    const createColumnsTable = `
      CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dataset_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        prompt TEXT,
        model TEXT,
        position INTEGER DEFAULT 0,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
      )
    `;

    // Create api_keys table
    const createApiKeysTable = `
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL UNIQUE,
        key TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create settings table
    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        type TEXT DEFAULT 'string',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Execute table creation
    await this.runSQLiteQuery(createDatasetsTable);
    await this.runSQLiteQuery(createColumnsTable);
    await this.runSQLiteQuery(createApiKeysTable);
    await this.runSQLiteQuery(createSettingsTable);
  }

  runSQLiteQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  getSQLiteData(query, params = []) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  runDuckDBQuery(query) {
    return new Promise((resolve, reject) => {
      const connection = this.duckDb.connect();
      connection.run(query, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
        connection.close();
      });
    });
  }

  async close() {
    try {
      if (this.sqliteDb) {
        await new Promise((resolve, reject) => {
          this.sqliteDb.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      if (this.duckDb) {
        await new Promise((resolve, reject) => {
          this.duckDb.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      console.log('Databases closed successfully');
    } catch (error) {
      console.error('Error closing databases:', error);
      throw error;
    }
  }

  async backup(backupPath) {
    try {
      // Backup SQLite database
      const sqliteSource = path.join(this.dataDir, this.environment, '.sqlite3');
      const sqliteBackup = path.join(backupPath, 'sqlite3.backup');
      await fs.copyFile(sqliteSource, sqliteBackup);

      // Backup DuckDB database
      const duckdbSource = path.join(this.dataDir, this.environment, 'duckdb', 'braincells.duckdb');
      const duckdbBackup = path.join(backupPath, 'duckdb.backup');
      await fs.copyFile(duckdbSource, duckdbBackup);

      console.log('Database backup completed');
    } catch (error) {
      console.error('Failed to backup databases:', error);
      throw error;
    }
  }

  async restore(backupPath) {
    try {
      // Close current connections
      await this.close();

      // Restore SQLite database
      const sqliteBackup = path.join(backupPath, 'sqlite3.backup');
      const sqliteTarget = path.join(this.dataDir, this.environment, '.sqlite3');
      await fs.copyFile(sqliteBackup, sqliteTarget);

      // Restore DuckDB database
      const duckdbBackup = path.join(backupPath, 'duckdb.backup');
      const duckdbTarget = path.join(this.dataDir, this.environment, 'duckdb', 'braincells.duckdb');
      await fs.copyFile(duckdbBackup, duckdbTarget);

      // Reinitialize connections
      await this.initialize();

      console.log('Database restore completed');
    } catch (error) {
      console.error('Failed to restore databases:', error);
      throw error;
    }
  }
}

module.exports = { DatabaseManager };