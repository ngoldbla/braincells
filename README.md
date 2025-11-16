# 🧠 Brain Cells - Intelligent Spreadsheet Automation

<div align="center">
  
  **Transform Your Data with AI-Powered Intelligence**  
  *Every Cell is a Brain Cell*
  
  <br>
  
  🚀 **Quick Start** | 📊 **AI Spreadsheets** | 🔒 **100% Local** | 🤖 **Open Source**
  
</div>

---

## 🎯 What is Brain Cells?

**Brain Cells** brings the power of AI to spreadsheets, running entirely on your local machine. Available as both a web application and native desktop app, Brain Cells transforms every cell in your spreadsheet into an intelligent processor capable of:

- 🤖 **AI-Powered Data Generation** - Generate data using natural language prompts
- 🔄 **Smart Data Transformation** - Clean, enrich, and transform your data with AI
- 🔒 **Complete Privacy** - Your data never leaves your machine
- ⚡ **Multiple AI Providers** - Use OpenAI, Anthropic, Ollama, vLLM, or run completely offline
- 🖥️ **Native Desktop App** - Cross-platform Tauri application (Windows, macOS, Linux)

---

## 🆕 Two Versions Available

### 1️⃣ **Web Application** (Docker-based)
- ✅ **Production-ready** with full spreadsheet functionality
- ✅ Quick setup with Docker Compose
- ✅ Complete feature set (see below)
- 📍 Best for: Users comfortable with Docker, server deployments

### 2️⃣ **Desktop Application** (Native Tauri)
- ✅ **Foundation complete** with multi-provider LLM support
- ⚙️ Spreadsheet UI migration in progress
- ✅ Native performance, smaller footprint
- ✅ No Docker required
- 📍 Best for: Users wanting native desktop experience

> **Status**: The desktop app foundation is production-ready with comprehensive LLM provider support (OpenAI, Anthropic, Ollama, and vLLM structure). Spreadsheet UI migration from web app is in progress. See [ROBUSTNESS_ROADMAP.md](ROBUSTNESS_ROADMAP.md) for details.

---

## ⚡ Quick Installation (5 Minutes)

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- **20GB+ free disk space** (Docker images require significant space)
- 8GB+ RAM recommended
- For macOS/Windows: Ensure Docker Desktop has sufficient disk allocation (Settings → Resources → Disk image size)

### 🚀 One-Command Install

#### For Mac/Linux Users:
```bash
# Clone and start Brain Cells
git clone https://github.com/ngoldbla/braincells.git
cd braincells
./start.sh  # Interactive setup script
```

#### For Windows Users:

```cmd
# Clone the repository
git clone https://github.com/ngoldbla/braincells.git
cd braincells

# Run the Windows setup script
start-windows.bat
```

**Alternative: Using WSL (Windows Subsystem for Linux)**
```bash
# First, install WSL if not already installed:
wsl --install

# Then in WSL terminal:
git clone https://github.com/ngoldbla/braincells.git
cd braincells
./start.sh
```

#### Manual Installation (All Platforms):
```bash
docker compose up -d
```

**That's it!** 🎉 Brain Cells will be available at: **http://localhost:3000**

> **First run:** Docker will download the required images and Ollama will pull the AI model (gpt-oss:20b). This may take 5-10 minutes depending on your internet connection.

> **Windows Users:** Use the `start-windows.bat` script for the best experience - it handles all Windows-specific requirements automatically.

---

## 🔑 Add Your Hugging Face Token (Recommended)

For the best experience, add your free Hugging Face token to unlock:
- Access to thousands of AI models
- Faster inference with cloud providers
- Advanced features and capabilities

### Get Your Token (2 minutes):
1. Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Sign up/login (it's free!)
3. Click "New token" → Name it "Brain Cells" → Create

### Add Your Token:

Create a `.env` file in the project directory:

```bash
# Create .env file
echo "HF_TOKEN=your_token_here" > .env

# Restart to apply
docker compose down
docker compose up -d
```

---

## 🎨 Features

### Powered by Leading AI Technology

| Component | Description | What it Does |
|-----------|-------------|--------------|
| **Brain Cells UI** | AI-powered spreadsheet interface | Transform data with natural language |
| **Ollama** | Local LLM runtime | Run AI models completely offline |
| **Hugging Face Integration** | Access to model hub | Use thousands of open models |

### What Can You Do?

- 📝 **Generate Content** - "Write product descriptions for these items"
- 🔍 **Extract Information** - "Extract email addresses from this text"
- 🌐 **Translate** - "Translate these phrases to Spanish"
- 📊 **Analyze** - "Categorize these reviews as positive/negative"
- 🧹 **Clean Data** - "Standardize these phone numbers"
- 💡 **And Much More!** - Limited only by your imagination

---

## 🛠️ Configuration Options

### Use Different AI Models

Edit `docker-compose.yml` to change the default model:

```yaml
ollama:
  command: |
    ollama serve &
    sleep 5
    ollama pull llama3.2  # Change model here
    tail -f /dev/null
```

Popular models:
- `llama3.2` - Fast and efficient (8GB RAM)
- `gpt-oss:20b` - Best quality (14GB RAM) [default]
- `mistral` - Good balance (8GB RAM)
- `phi` - Lightweight (4GB RAM)

### Add API Keys for Cloud Providers

Create a `.env` file with any of these optional keys:

```bash
# Hugging Face (recommended)
HF_TOKEN=hf_xxxxxxxxxxxxx

# Optional cloud providers
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### Change Ports

If port 3000 is in use, edit `docker-compose.yml`:

```yaml
braincells:
  ports:
    - "8080:3000"  # Change 8080 to your preferred port
```

---

## 📖 Usage Guide

### 1. Access Brain Cells
Open your browser and navigate to: **http://localhost:3000**

### 2. Create or Import Data
- Click "Create a dataset" to start fresh
- Drag and drop a CSV file to import existing data
- Import from Hugging Face Hub

### 3. Add AI-Powered Columns
1. Click the "+" button to add a new column
2. Enter a prompt describing what you want
3. Click "Run" to generate data for all rows

### 4. Configure AI Settings
- Click the settings icon in any column header
- Choose your preferred AI model
- Adjust parameters for your use case

---

## 🔧 Troubleshooting

### "No space left on device" error during installation
This is the most common issue. Solutions:

1. **Clean Docker system** (recommended first step):
   ```bash
   docker system prune -a --volumes
   ```
   This removes all unused containers, images, and volumes.

2. **Check available disk space**:
   ```bash
   df -h
   ```
   You need at least 20GB free space.

3. **Increase Docker Desktop disk space**:
   
   **macOS/Windows:**
   - Open Docker Desktop → Settings (gear icon)
   - Go to Resources → Advanced
   - Increase "Disk image size" to at least 80GB (recommended: 100GB+)
   - Click "Apply & Restart"
   
   **Note:** This creates more space for ALL Docker images/containers, not just Brain Cells

4. **macOS specific**:
   - Docker Desktop creates a large disk image file
   - Location: `~/Library/Containers/com.docker.docker/Data/vms/0/`
   - If needed, reinstall Docker Desktop after cleaning up disk space

### Brain Cells won't start
```bash
# Check if containers are running
docker ps

# View logs
docker compose logs braincells
docker compose logs ollama
```

### Port already in use
```bash
# Stop conflicting service or change port in docker-compose.yml
lsof -i :3000  # Find what's using port 3000
```

### Out of memory
- Use a smaller model (edit `docker-compose.yml`)
- Allocate more memory to Docker Desktop
- Close other applications

### Slow performance
- First run downloads models (wait 5-10 minutes)
- Use a smaller model for faster inference
- Add a Hugging Face token for cloud acceleration

---

## 🚀 Advanced Features

### Run Without Ollama (Cloud Only)
If you only want to use cloud providers:

```bash
# Set in .env file
DISABLE_OLLAMA=true
HF_TOKEN=your_token_here
```

### Custom Model Endpoints
Use your own model endpoints:

```bash
# In .env file
MODEL_ENDPOINT_URL=https://your-endpoint.com
MODEL_ENDPOINT_NAME=custom-model
```

### Enterprise Deployment
For production deployments, contact: support@braincells.ai

---

## 🛠 Troubleshooting

### Windows-Specific Issues

#### Docker Desktop Not Starting
- Ensure virtualization is enabled in BIOS
- Restart Windows after Docker Desktop installation
- Check that Hyper-V is enabled (Windows Pro/Enterprise)
- For Windows Home, ensure WSL 2 backend is installed

#### Line Ending Errors (CRLF vs LF)
If you encounter errors with the bash script, use the Windows batch file instead:
```cmd
start-windows.bat
```

Or use WSL (Windows Subsystem for Linux):
```bash
# Install WSL
wsl --install

# Run commands in WSL terminal
wsl
cd /mnt/c/path/to/braincells
./start.sh
```

### General Issues

#### Port 3000 Already in Use
```bash
# Find and stop the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

#### Docker Disk Space Issues
1. Open Docker Desktop
2. Settings → Resources → Advanced
3. Increase "Disk image size" to 80-100GB
4. Apply & Restart

#### Slow Performance
- Allocate more RAM to Docker Desktop (Settings → Resources)
- Ensure no antivirus is scanning Docker files
- Use SSD storage for Docker images

---

## 🤝 Contributing

Brain Cells is open source! We welcome contributions:

- 🐛 [Report bugs](https://github.com/ngoldbla/braincells/issues)
- 💡 [Suggest features](https://github.com/ngoldbla/braincells/discussions)
- 🔧 [Submit pull requests](https://github.com/ngoldbla/braincells/pulls)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

### Attribution

Brain Cells is built on top of:
- [Hugging Face AI Sheets](https://huggingface.co/spaces/HuggingFace/ai-sheets) - The original open-source spreadsheet AI interface
- [Ollama](https://ollama.ai) - Local LLM runtime
- Various open-source AI models from the community

---

## 📖 Documentation

- **[ROBUSTNESS_ROADMAP.md](ROBUSTNESS_ROADMAP.md)** - Comprehensive plan for production-ready desktop app
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Current implementation status
- **[desktop/README.md](desktop/README.md)** - Desktop app user guide
- **[desktop/ARCHITECTURE.md](desktop/ARCHITECTURE.md)** - Technical architecture
- **[desktop/MIGRATION_GUIDE.md](desktop/MIGRATION_GUIDE.md)** - Migration roadmap

## 🔗 Links

- **GitHub**: [github.com/ngoldbla/braincells](https://github.com/ngoldbla/braincells)
- **Issues**: [github.com/ngoldbla/braincells/issues](https://github.com/ngoldbla/braincells/issues)

---

<div align="center">
  <strong>Transform Your Data with Intelligence</strong><br>
  Every Cell is a Brain Cell 🧠<br>
  <br>
  <em>Made with ❤️ by the Open Source Community</em>
</div>