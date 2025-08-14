# 🛠️ AI Data Workbench (Crawl4AI + AI Sheets + Ollama)

A one-click Docker Compose stack that turns your laptop or workstation into an **AI-powered data lab**:

| Service  | What it does | Default URL |
|----------|--------------|-------------|
| **AI Sheets** | Low-code spreadsheet UI for prompting, cleaning & enriching data with any LLM | <http://localhost:3000> |
| **Ollama**    | Local model runner – completely offline if you want | <http://localhost:11434> (REST) |
| **Crawl4AI** | Fast website crawler/ scraper ready for RAG pipelines | CLI in the `crawl4ai` container |

---

## ✨ Features

* **Bring-your-own keys** – works with Hugging Face, OpenAI, Anthropic, etc.
* **Model selector** – choose a local model size that matches your hardware (Phi-3 △, Mistral-7B △△, GPT-OSS-20B △△△, Phi-3-mini, Gemma-2B, …).
* **No compilation** – just Docker Desktop on Windows/macOS/Linux.
* **Offline-friendly** – skip cloud keys entirely and run everything on your GPU/CPU with Ollama.

---

## 🚀 Quick start

> **Prerequisites**
> * Docker Desktop **v24+** (Win/Mac) or Docker Engine (Linux)
> * ~15 GB free disk (models are large!)
>

```bash
# 1. Clone repository
 git clone https://github.com/YOUR-NAMESPACE/ai-data-workbench.git
 cd ai-data-workbench

# 2. Copy env template and edit values
 cp .env.template .env
 $EDITOR .env   # or open with VS Code / Notepad / TextEdit

# 3. Fire it up 🚀
 docker compose up -d

# 4. Open your browser
 open http://localhost:3000   # macOS
 start http://localhost:3000  # Windows PowerShell
```

First load may take several minutes while Docker pulls images **and** Ollama downloads the model you selected.

---

## ⚙️ Configuration (.env)

Create a `.env` file (step 2 above) – anything you leave blank is simply ignored.

```ini
# === Mandatory ===
HF_TOKEN=           # Get one at https://huggingface.co/settings/tokens

# === Optional cloud providers ===
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
# or another Inference Endpoint:  MODEL_ENDPOINT_URL=https://....

# === Local model ===
# Pick ONE from the table below. Larger models need more RAM/VRAM.
OLLAMA_MODEL=gpt-oss:20b
```

### Choosing a local model

| `OLLAMA_MODEL` value | VRAM / RAM needed | Notes |
|----------------------|-------------------|-------|
| `phi:2.7b`           | 4 GB              | Super-light, good for laptop CPUs |
| `gemma:2b`           | 6 GB              | Google Gemma small, creative |
| `mistral:7b`         | 8 GB              | Balanced chat model |
| `gpt-oss:20b` (default) | 12–14 GB        | Solid 20B chat model |
| `gpt-oss:120b`       | 30–40 GB          | Monster – only if you have a big GPU/CPU RAM |

If you don’t want any local model (e.g. you’ll use OpenAI), set `DISABLE_OLLAMA=true`.

### Cloud only?

Just leave `OLLAMA_MODEL` blank **and** supply one of:

* `HF_TOKEN` – runs via Hugging Face Inference Endpoints (pay-as-you-go)
* `OPENAI_API_KEY` – uses OpenAI Chat Completions
* `ANTHROPIC_API_KEY` – uses Claude models

AI Sheets automatically picks the first available backend.

---

## 🖥️ OS-specific tips

### Windows 11/10

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and enable **WSL 2 backend**.
2. Run the commands in *PowerShell*.
3. To open the app after boot: `docker compose start`.

### macOS (Apple Silicon & Intel)

* Docker Desktop handles multi-arch images – the stack ships `linux/arm64` & `linux/amd64`.
* Use `brew install ollama` if you ever want to run Ollama outside Docker.

### Linux

* Any recent distro with Docker Engine works.
* Add your user to `docker` group to avoid `sudo` each time.

---

## 🛠️ Using the tools

### AI Sheets UI

1. Visit `http://localhost:3000`.
2. Click **⚙ Settings → Keys** to paste additional API keys any time.
3. Create or upload a CSV, then type a prompt in a new column, hit **▶ Run**.

### Crawl4AI

Open a shell in the container:

```bash
docker compose exec crawl4ai bash
# example crawl
crwl https://docs.python.org --deep-crawl bfs --max-pages 20 --output markdown
```

Results appear under `./data` inside the container (mount volumes if you need persistence).

### Talk to the local model directly

```bash
curl -s http://localhost:11434/api/generate -d '{"model":"gpt-oss:20b","prompt":"Hello"}' | jq -r .response
```

---

## 🤖 Extending / troubleshooting

* **Change ports** – edit `docker-compose.yml`.
* **Memory errors with Ollama** – swap to a smaller model (`OLLAMA_MODEL=phi:2.7b`).
* **HF 401 errors** – make sure `HF_TOKEN` is valid & has *Inference Endpoints* scope.
* **Update images** – `docker compose pull && docker compose up -d`.

---

## 📄 License

MIT – use, fork & share!
