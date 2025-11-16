# Migration Guide: Docker → Tauri Desktop

This guide explains how to migrate the existing Docker-based Brain Cells application to the new Tauri desktop architecture.

## What's Been Done

### ✅ Phase 1: Foundation (COMPLETE)
- Tauri project initialized with React + TypeScript
- Cross-platform build configuration (Windows, macOS, Linux)
- Development environment setup

### ✅ Phase 2: Provider System (COMPLETE)
- LLM provider abstraction layer
- Cloud providers: OpenAI, Anthropic, Custom
- Local provider: Ollama with subprocess management
- vLLM support structure (implementation pending)

### ✅ Phase 3: Backend Commands (COMPLETE)
- Tauri commands for all LLM operations
- Configuration management commands
- Secure credential storage with tauri-plugin-store
- Cross-platform path handling

### ✅ Phase 4: UI & UX (COMPLETE)
- Setup wizard with 4 steps
- Provider selection and configuration flow
- Ollama installation and model download UI
- State management with Zustand
- Tailwind CSS styling

## What Needs to Be Migrated

### 🔄 Phase 5: Core Spreadsheet Functionality

#### Current (Docker/Qwik):
- Location: `aisheets/src/features/table/`
- Framework: Qwik
- State: Qwik signals
- Backend: Express routes

#### Target (Desktop/React):
- Location: `desktop/src/components/spreadsheet/`
- Framework: React
- State: Zustand
- Backend: Tauri commands

**Migration Steps:**

1. **Convert Table Component**
   ```typescript
   // From: aisheets/src/features/table/Table.tsx (Qwik)
   export const Table = component$(() => {
     const columns = useSignal<Column[]>([]);
     // ...
   });

   // To: desktop/src/components/spreadsheet/Table.tsx (React)
   export function Table() {
     const columns = useSpreadsheetStore(state => state.columns);
     // ...
   }
   ```

2. **Port Cell Rendering Logic**
   - `aisheets/src/features/table/Cell.tsx` → React component
   - Migrate Qwik event handlers to React onClick/onChange
   - Convert useSignal() to Zustand or useState()

3. **Migrate Formula System**
   - `aisheets/src/usecases/generate-cells.ts` → Tauri commands
   - Use new provider system instead of direct Ollama calls
   - Support multiple providers

### 🔄 Phase 6: Database Integration

#### Current:
```typescript
// aisheets/src/services/db/db.ts
import Database from 'duckdb-async';

const db = await Database.create(':memory:');
```

#### Target:
```rust
// desktop/src-tauri/src/database/mod.rs
use duckdb::{Connection, Result};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Self { conn })
    }
}
```

**Migration Steps:**

1. Add DuckDB to Cargo.toml:
   ```toml
   [dependencies]
   duckdb = "0.10"
   ```

2. Create Tauri commands for database operations:
   ```rust
   #[tauri::command]
   pub async fn execute_query(query: String) -> Result<Vec<Row>, String>

   #[tauri::command]
   pub async fn create_table(name: String, schema: Schema) -> Result<(), String>
   ```

3. Migrate table/dataset models:
   - `aisheets/src/services/db/models/` → Rust structs

### 🔄 Phase 7: Vector Storage (LanceDB)

#### Current:
```typescript
// aisheets/src/services/repository/embeddings.ts
import * as lancedb from 'vectordb';

const db = await lancedb.connect('./data/vectors');
```

#### Target:
```rust
// desktop/src-tauri/src/vectors/mod.rs
use lancedb::{connect, Connection};

pub async fn connect_vectors() -> Result<Connection> {
    let uri = paths::get_vectors_dir()?;
    connect(&uri.to_string_lossy()).await
}
```

**Migration Steps:**

1. Add LanceDB to Cargo.toml
2. Create vector operations commands
3. Port embedding generation logic

### 🔄 Phase 8: Web Search

#### Current:
```typescript
// aisheets/src/services/websearch/
export async function searchWeb(query: string): Promise<SearchResult[]>
```

#### Target:
```rust
// desktop/src-tauri/src/commands/websearch.rs
#[tauri::command]
pub async fn search_web(query: String) -> Result<Vec<SearchResult>, String>
```

Use Tauri's HTTP plugin with proper scope configuration.

### 🔄 Phase 9: Image Generation

#### Current:
```typescript
// aisheets/src/services/inference/text-to-image.ts
export async function generateImage(prompt: string): Promise<ImageResult>
```

#### Target:
```rust
// desktop/src-tauri/src/commands/image.rs
#[tauri::command]
pub async fn generate_image(
    provider: ProviderConfig,
    prompt: String,
) -> Result<ImageResult, String>
```

Support DALL-E, Stable Diffusion, etc.

## File Mapping

### Components

| Docker/Qwik | Tauri/React |
|-------------|-------------|
| `aisheets/src/features/table/Table.tsx` | `desktop/src/components/spreadsheet/Table.tsx` |
| `aisheets/src/features/table/Cell.tsx` | `desktop/src/components/spreadsheet/Cell.tsx` |
| `aisheets/src/features/table/toolbar/` | `desktop/src/components/spreadsheet/Toolbar.tsx` |
| `aisheets/src/features/user/` | `desktop/src/components/settings/` |

### State Management

| Docker/Qwik | Tauri/React |
|-------------|-------------|
| `aisheets/src/state/columns.ts` (signals) | `desktop/src/stores/spreadsheet-store.ts` (Zustand) |
| `aisheets/src/state/datasets.tsx` | `desktop/src/stores/dataset-store.ts` |
| `aisheets/src/state/session.ts` | `desktop/src/stores/session-store.ts` |

### Backend Logic

| Docker/Express | Tauri/Rust |
|----------------|------------|
| `aisheets/src/routes/` | `desktop/src-tauri/src/commands/` |
| `aisheets/src/usecases/generate-cells.ts` | `desktop/src-tauri/src/commands/cells.rs` |
| `aisheets/src/services/inference/` | `desktop/src-tauri/src/providers/` |
| `aisheets/src/services/db/` | `desktop/src-tauri/src/database/` |

## Migration Checklist

- [ ] **Spreadsheet UI**
  - [ ] Convert Table component to React
  - [ ] Convert Cell component to React
  - [ ] Port toolbar and context menus
  - [ ] Migrate keyboard shortcuts
  - [ ] Port drag-and-drop functionality

- [ ] **Data Layer**
  - [ ] Add DuckDB to Rust backend
  - [ ] Create database commands
  - [ ] Migrate table/dataset models
  - [ ] Port SQL query builders

- [ ] **Vector Storage**
  - [ ] Add LanceDB to Rust backend
  - [ ] Create vector commands
  - [ ] Port embedding logic
  - [ ] Migrate vector search

- [ ] **Features**
  - [ ] Port web search functionality
  - [ ] Port image generation
  - [ ] Migrate formula system
  - [ ] Port data import/export

- [ ] **Testing**
  - [ ] Unit tests for Rust commands
  - [ ] Integration tests for providers
  - [ ] E2E tests for critical flows
  - [ ] Cross-platform testing

- [ ] **Documentation**
  - [ ] User guide
  - [ ] API documentation
  - [ ] Contributing guide
  - [ ] Release notes

## Development Workflow

### Running Both Versions

During migration, you can run both versions:

```bash
# Docker version (original)
cd /home/user/braincells
./start.sh

# Tauri version (new)
cd /home/user/braincells/desktop
npm run tauri dev
```

### Testing Strategy

1. **Feature Parity Testing**: For each migrated feature, compare behavior
2. **Performance Testing**: Ensure desktop version is faster
3. **Data Migration Testing**: Test importing existing data

### Rollout Plan

1. **Alpha**: Core spreadsheet + cloud providers
2. **Beta**: Add local AI + database
3. **RC**: Full feature parity
4. **v1.0**: Stable release, deprecate Docker version

## Breaking Changes

### User-Facing

- **Configuration**: Stored in OS-specific locations instead of Docker volumes
- **Data**: Must export from Docker version and import to desktop
- **URLs**: No localhost server, direct desktop app

### Developer-Facing

- **Framework**: Qwik → React
- **Backend**: Express → Tauri (Node.js → Rust)
- **Build**: Docker → Native installers
- **Deployment**: Container registry → GitHub Releases

## Benefits of Migration

### For Users

- **Faster**: Native performance, no Docker overhead
- **Simpler**: Single-click installer, no Docker required
- **Offline**: Works without internet (with local AI)
- **Secure**: OS-level encryption for credentials
- **Updates**: Auto-update built-in

### For Developers

- **Type Safety**: Rust backend catches errors at compile time
- **Performance**: Rust is 10-100x faster than Node.js for CPU-bound tasks
- **Cross-Platform**: Single codebase, multiple platforms
- **Modern**: Latest React, TypeScript, Tailwind
- **Maintainable**: Clear separation of concerns

## Timeline Estimate

- **Phase 5** (Spreadsheet UI): 2-3 weeks
- **Phase 6** (Database): 1-2 weeks
- **Phase 7** (Vectors): 1 week
- **Phase 8** (Web Search): 1 week
- **Phase 9** (Image Gen): 1 week
- **Testing & Polish**: 2-3 weeks

**Total**: 8-12 weeks to feature parity

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Migration Guide](https://react.dev/learn)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [DuckDB Rust](https://github.com/duckdb/duckdb-rs)
- [LanceDB Rust](https://github.com/lancedb/lancedb)

## Getting Help

- Check ARCHITECTURE.md for design decisions
- See examples in `desktop/src/components/setup-wizard/`
- Review existing Tauri commands in `desktop/src-tauri/src/commands/`
- Ask in GitHub Discussions
