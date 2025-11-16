# Brain Cells Desktop - Architecture

## Overview

Brain Cells Desktop is built using a modern, cross-platform architecture that prioritizes:

- **Performance**: Native code (Rust) for backend logic
- **Security**: Encrypted credential storage, sandboxed execution
- **Flexibility**: Support for multiple AI providers (cloud and local)
- **User Experience**: First-run wizard, intuitive configuration
- **Cross-Platform**: Single codebase for Windows, macOS, Linux

## Technology Stack

### Frontend

- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **Vite**: Fast development and building

### Backend

- **Tauri 2.0**: Cross-platform desktop framework
- **Rust**: High-performance, memory-safe backend
- **Tokio**: Async runtime for concurrent operations
- **Reqwest**: HTTP client for API calls
- **Serde**: Serialization/deserialization

### Plugins

- **tauri-plugin-store**: Encrypted configuration storage
- **tauri-plugin-shell**: Subprocess management (Ollama, vLLM)
- **tauri-plugin-fs**: Secure file system access
- **tauri-plugin-http**: Scoped HTTP requests

## Architecture Layers

### 1. Frontend Layer (React/TypeScript)

```
Components
├── SetupWizard
│   ├── WelcomeStep
│   ├── ProviderSelectionStep
│   ├── CloudConfigStep
│   ├── OllamaConfigStep
│   └── CompletionStep
└── (Spreadsheet UI - to be migrated)

Stores (Zustand)
├── ProviderStore: Manages provider configurations
└── SetupStore: Manages wizard state

API Layer (src/lib/tauri-api.ts)
└── Typed wrappers for all Tauri commands
```

**Responsibilities:**
- User interface and interactions
- State management
- Calling backend via Tauri commands
- Displaying results and errors

### 2. IPC Layer (Tauri Commands)

Tauri provides a type-safe bridge between frontend (JavaScript) and backend (Rust):

```rust
#[tauri::command]
pub async fn generate_text(
    config: ProviderConfig,
    prompt: String,
    max_tokens: Option<u32>,
    temperature: Option<f32>,
    system_message: Option<String>,
) -> Result<GenerateResponse, String>
```

Frontend calls:

```typescript
const response = await invoke('generate_text', {
  config,
  prompt,
  maxTokens: 1000,
  temperature: 0.7,
  systemMessage: 'You are a helpful assistant',
});
```

**Responsibilities:**
- Type-safe communication
- Serialization/deserialization
- Error handling and propagation

### 3. Backend Layer (Rust)

#### Commands Module (`src-tauri/src/commands/`)

Exposes functionality to frontend:

- **llm.rs**: LLM operations (generate, list models, test connection)
- **config.rs**: Configuration management (paths, platform info)
- **process.rs**: Process management (install Ollama, check requirements)

#### Providers Module (`src-tauri/src/providers/`)

Implements LLM provider abstraction:

```rust
#[async_trait]
pub trait LLMProvider: Send + Sync {
    fn provider_type(&self) -> ProviderType;
    async fn check_status(&self) -> Result<ProviderStatus>;
    async fn start(&mut self) -> Result<()>;
    async fn stop(&mut self) -> Result<()>;
    async fn generate(&self, request: GenerateRequest) -> Result<GenerateResponse>;
    async fn test_connection(&self) -> Result<bool>;
    async fn list_models(&self) -> Result<Vec<String>>;
}
```

**Implementations:**

- **cloud.rs**:
  - `OpenAIProvider`: OpenAI API client
  - `AnthropicProvider`: Anthropic API client
  - `CustomProvider`: Generic OpenAI-compatible APIs

- **ollama.rs**:
  - `OllamaProvider`: Manages Ollama subprocess and HTTP API
  - Model pulling with progress
  - Automatic restart on failure

#### Utils Module (`src-tauri/src/utils/`)

Cross-platform utilities:

- **paths.rs**: Platform-specific directory paths
- **installer.rs**: Ollama installation, system requirements

## Data Flow

### Example: Generating Text with a Cloud Provider

```
1. User enters prompt in UI
   └─> React component updates state

2. Component calls Tauri API
   └─> invoke('generate_text', { config, prompt, ... })

3. Tauri IPC deserializes arguments
   └─> Calls Rust command: generate_text()

4. Command creates provider from config
   └─> create_provider(&config) -> Box<dyn LLMProvider>

5. Provider makes HTTP request
   └─> OpenAIProvider::generate() -> reqwest::post()

6. API returns response
   └─> Parsed into GenerateResponse

7. Result serialized and sent to frontend
   └─> React component receives response

8. UI displays result to user
   └─> Update state, render in component
```

### Example: Starting Ollama Locally

```
1. User clicks "Start Ollama" in setup wizard
   └─> Calls startOllama(11434, true)

2. Tauri command start_ollama() executes
   └─> Creates OllamaProvider

3. Provider checks if Ollama is installed
   └─> Command::new("ollama").arg("--version")

4. Provider spawns Ollama subprocess
   └─> Command::new("ollama").arg("serve").spawn()

5. Provider waits for Ollama to be ready
   └─> HTTP GET http://localhost:11434/api/tags

6. Returns success to frontend
   └─> UI shows "Ollama is running"

7. User can now select and pull models
   └─> Calls pullOllamaModel("llama3.3")
```

## Security Architecture

### Credential Storage

- Uses Tauri's **tauri-plugin-store** for encrypted storage
- Credentials never logged or transmitted except to configured provider
- Store file encrypted at rest using OS keychain integration

### Sandboxing

Tauri provides several layers of security:

1. **CSP (Content Security Policy)**: Prevents XSS attacks
2. **IPC Scope**: Only registered commands can be called
3. **FS Scope**: File access restricted to specific directories
4. **HTTP Scope**: Network requests restricted to whitelisted domains
5. **Shell Scope**: Only approved commands can be executed

Example from `tauri.conf.json`:

```json
{
  "plugins": {
    "http": {
      "scope": [
        "http://localhost:*",
        "https://api.openai.com/*",
        "https://api.anthropic.com/*"
      ]
    },
    "fs": {
      "scope": [
        "$APPDATA/*",
        "$HOME/.braincells/*"
      ]
    }
  }
}
```

## State Management

### Frontend State (Zustand)

**ProviderStore** (persisted to localStorage):
```typescript
{
  providers: ProviderConfig[],
  currentProviderId: string | null,

  addProvider(),
  removeProvider(),
  updateProvider(),
  setCurrentProvider(),
  getCurrentProvider(),
  setDefaultProvider()
}
```

**SetupStore** (session state):
```typescript
{
  hasCompletedSetup: boolean,
  currentStep: number,
  selectedProviderType: ProviderType | null,

  setHasCompletedSetup(),
  setCurrentStep(),
  setSelectedProviderType(),
  nextStep(),
  previousStep(),
  resetSetup()
}
```

### Backend State

- Stateless command handlers
- Provider instances created per-request
- Long-running processes (Ollama) tracked via PID

## Cross-Platform Considerations

### Path Handling

```rust
pub fn get_app_data_dir() -> Result<PathBuf> {
    let dir = dirs::data_dir()
        .ok_or_else(|| anyhow!("Could not determine data directory"))?
        .join("BrainCells");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}
```

Results in:
- Windows: `C:\Users\<user>\AppData\Roaming\BrainCells`
- macOS: `/Users/<user>/Library/Application Support/BrainCells`
- Linux: `/home/<user>/.local/share/braincells`

### Process Management

Ollama lifecycle:

1. **Check Installation**: Try to run `ollama --version`
2. **Start Process**: Spawn with platform-specific environment
3. **Monitor Health**: Periodic HTTP health checks
4. **Auto-Restart**: On crash, attempt restart with backoff
5. **Graceful Shutdown**: Kill process on app exit (optional)

## Build and Distribution

### Development Build

```bash
npm run tauri dev
```

- Rust compiled in debug mode (faster compilation)
- Vite dev server with HMR
- DevTools enabled
- Console logging enabled

### Production Build

```bash
npm run tauri build
```

Creates platform-specific bundles:

- **Windows**: `.msi` installer (WiX Toolset)
- **macOS**: `.dmg` disk image (universal binary)
- **Linux**: `.AppImage`, `.deb`, `.rpm`

### Code Signing

For distribution, you'll need:

- **Windows**: Code signing certificate
- **macOS**: Apple Developer certificate
- **Linux**: GPG key (for package signing)

## Performance Optimizations

### Lazy Loading

- Providers created only when needed
- Models loaded on-demand
- Heavy components dynamically imported

### Async Operations

All I/O operations are async:

```rust
#[tauri::command]
pub async fn generate_text(...) -> Result<GenerateResponse, String> {
    // Runs on Tokio thread pool
    // Doesn't block UI
}
```

### Caching

- Model lists cached for 5 minutes
- System requirements cached until app restart
- Provider status cached with TTL

## Future Architecture Enhancements

### Planned Features

1. **Database Layer**: Integrate DuckDB for local data
2. **Vector Storage**: LanceDB for embeddings
3. **Plugin System**: Allow custom providers
4. **Streaming**: Support streaming responses
5. **Background Jobs**: Queue system for long-running tasks
6. **Multi-Window**: Separate windows for different sheets
7. **Auto-Update**: Tauri's built-in updater

### Migration Path

The existing Docker-based Qwik application will be migrated:

1. Port Qwik components to React
2. Migrate Express routes to Tauri commands
3. Integrate DuckDB as embedded database
4. Port inference logic to provider system
5. Add web search and image generation
6. Implement data import/export

## Conclusion

This architecture provides a solid foundation for a cross-platform, performant, and secure AI-powered spreadsheet application. The separation of concerns (UI, IPC, Business Logic, Providers) makes it easy to extend and maintain.
