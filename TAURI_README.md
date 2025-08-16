# Brain Cells - Tauri Desktop Application

## Overview
Brain Cells has been converted into a Tauri desktop application, providing a native desktop experience for intelligent spreadsheet automation.

## Prerequisites
- Node.js 18+ (preferably Node.js 20+ for all dependencies)
- Rust (installed via rustup)
- npm or pnpm

## Installation

1. Navigate to the aisheets directory:
```bash
cd aisheets
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

## Setting Up AI Providers

### Using Ollama (Recommended for Local Development)

1. **Install Ollama**:
```bash
brew install ollama  # macOS
# Or download from https://ollama.ai
```

2. **Start Ollama service**:
```bash
ollama serve
```

3. **Pull a model**:
```bash
ollama pull llama3.2  # Fast, good for testing
ollama pull mistral   # Alternative model
ollama pull gemma2    # Google's model
```

4. **Configure in the app**:
- Click the Settings button in the sidebar
- Enable "Ollama for local model inference"
- Set endpoint (default: http://localhost:11434)
- Choose your model (e.g., llama3.2)
- Click "Test Ollama Connection" to verify
- Save settings

### Using Hugging Face API

1. **Get an API token**:
- Go to https://huggingface.co/settings/tokens
- Create a new token with "Make calls to serverless Inference API" permission

2. **Configure in the app**:
- Click the Settings button in the sidebar
- Enter your HF API token
- Optionally set a custom endpoint
- Save settings

## Development

Run the Tauri app in development mode:
```bash
npm run tauri:dev
```

This will:
- Start the Vite development server
- Launch the Tauri desktop window
- Enable hot reload for both frontend and backend changes
- Load saved settings from previous sessions

## Building

Build the Tauri app for production:
```bash
npm run tauri:build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`.

## Available Scripts

- `npm run tauri` - Run Tauri CLI commands
- `npm run tauri:dev` - Start development server with Tauri
- `npm run tauri:build` - Build production Tauri app
- `npm run tauri:info` - Display Tauri environment info
- `npm run tauri:icon` - Generate app icons

## Features Added

### Frontend Integration
- Added Tauri API hooks (`src/hooks/use-tauri.ts`)
- Added Tauri status indicator component
- Shows whether running in Tauri or browser mode
- Displays system information when in Tauri mode
- **Settings Modal** for configuring AI providers
  - Ollama integration for local inference
  - Hugging Face API key configuration
  - Embedding provider selection

### Backend Integration
- Rust backend with Tauri commands
- `greet` command for testing
- `get_system_info` command for system details
- **Settings persistence** with `save_settings` and `load_settings` commands
- **Ollama connection testing** with `test_ollama_connection` command
- Settings stored in app config directory
- Logging support in debug mode

### AI Inference Integration
- **Ollama Support** (`src/services/inference/ollama-adapter.ts`)
  - Local model inference through Ollama
  - Support for chat completion and embeddings
  - Automatic detection when Ollama is configured
- **Hugging Face API** integration
  - API key configuration through UI
  - Custom endpoint support
- Dynamic provider switching based on configuration

## Project Structure
```
aisheets/
├── src/                    # Frontend Qwik application
│   ├── hooks/
│   │   └── use-tauri.ts   # Tauri API integration
│   └── components/
│       └── ui/
│           └── tauri-status/ # Tauri status component
├── src-tauri/             # Tauri backend
│   ├── src/
│   │   ├── main.rs       # Entry point
│   │   └── lib.rs        # Tauri commands
│   ├── Cargo.toml        # Rust dependencies
│   └── tauri.conf.json   # Tauri configuration
└── package.json          # Node dependencies + scripts
```

## Configuration

The Tauri configuration is in `src-tauri/tauri.conf.json`:
- App identifier: `com.braincells.app`
- Window size: 1400x900 (min: 1024x768)
- Dev URL: `http://localhost:5173`
- Build output: `dist/`

## Troubleshooting

### Node Version Issues / "File is not defined" Error
If you encounter a "ReferenceError: File is not defined" error when running `npm run tauri:dev`, this is due to the `undici` package requiring Node.js 20+. 

**Solution for Node.js 18 users:**
The `undici` package has been downgraded to version 5.x which is compatible with Node.js 18. If you encounter this error, ensure your package.json has:
```json
"undici": "^5.28.4"
```

Then reinstall dependencies:
```bash
npm install --legacy-peer-deps
```

**Alternative solution:** Upgrade to Node.js 20+:
```bash
node --version  # Check current version
# If below 20, upgrade Node.js
```

### Rust Not Found / Cargo Metadata Error
If you see "failed to get cargo metadata: No such file or directory", install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

The npm scripts have been configured to include the cargo PATH automatically. If you still have issues, you can manually add cargo to your PATH:
```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

### Port 5173 Already in Use
If you see "Error: Port 5173 is already in use", there's likely a lingering dev server process:

**Quick fix:**
```bash
# Kill any process using port 5173
./kill-port-5173.sh
```

**Manual fix:**
```bash
# Find the process using port 5173
lsof -i :5173

# Kill the process (replace PID with the actual process ID)
kill <PID>
```

### ML Model Loading Hangs (dtype warning)
If the app hangs with a message like "dtype not specified for 'model'", this is because the app is trying to load a machine learning model locally at startup, which can take a long time or fail.

**Solution:**
The `tauri:dev` script has been configured to set dummy environment variables that prevent local model loading:
```bash
npm run tauri:dev  # Already includes the fix
```

**Alternative:** Create a `.env` file with:
```bash
EMBEDDING_MODEL_PROVIDER=dummy
EMBEDDING_ENDPOINT_URL=http://localhost:9999/dummy
```

**Note:** This disables the embedding functionality but allows the app to start. For production use, you would need to either:
- Set up a proper embedding endpoint
- Allow time for the model to load (can take 1-2 minutes on first run)
- Use a Hugging Face API token for remote inference

### "Could not resolve katex" Error
If you see an error about missing `katex` dependency:
```bash
npm install katex --legacy-peer-deps
```

This is a peer dependency of `marked-katex-extension` that needs to be installed manually.

### 401 Authentication Errors
The "Invalid credentials" errors when fetching models are non-critical for local development. The `tauri:dev` script includes a dummy HF_TOKEN to suppress these errors. For production use, set a real Hugging Face token:
```bash
HF_TOKEN=your_actual_token npm run tauri:dev
```

### Dependency Conflicts
Use `--legacy-peer-deps` when installing packages:
```bash
npm install --legacy-peer-deps
```

## Next Steps

To further enhance the Tauri integration:
1. Add file system access for local data processing
2. Implement native menu bars
3. Add system tray support
4. Enable auto-updates
5. Add native notifications
6. Integrate with OS-specific features