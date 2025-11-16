# Brain Cells

**AI-powered spreadsheet automation running entirely on your computer.**

## Installation

### What You Need
- **Docker Desktop** ([Download here](https://www.docker.com/products/docker-desktop))
- **20GB+ free disk space**
- **8GB+ RAM**

### Install on Mac/Linux

```bash
git clone https://github.com/ngoldbla/braincells.git
cd braincells
./start.sh
```

### Install on Windows

```cmd
git clone https://github.com/ngoldbla/braincells.git
cd braincells
start-windows.bat
```

**That's it.** Open your browser to **http://localhost:3000**

> First run takes 5-10 minutes while downloading AI models.

## What Can You Do?

- Generate content from prompts ("Write product descriptions for these items")
- Extract information ("Pull email addresses from this text")
- Translate text ("Translate to Spanish")
- Analyze data ("Categorize these reviews as positive/negative")
- Clean data ("Standardize these phone numbers")

## Common Issues

**"No space left on device"**
```bash
docker system prune -a --volumes
```

**Port 3000 already in use**
- Edit `docker-compose.yml` and change `"3000:3000"` to `"8080:3000"` (or any free port)

**Won't start**
```bash
docker compose logs
```

## License

MIT License - See [LICENSE](LICENSE)

Built on [Hugging Face AI Sheets](https://huggingface.co/spaces/HuggingFace/ai-sheets) and [Ollama](https://ollama.ai).
