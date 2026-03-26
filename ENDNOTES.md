# braincells — Migration Endnotes

## What's Built

The full greenfield Next.js 15 + Supabase + OpenAI app is complete and builds successfully.

### Phases Completed

- **Phase 0** ✅ — Next.js scaffolded with Tailwind, shadcn/ui (zinc theme, dark mode), all deps installed
- **Phase 1** ✅ — Supabase schema (001_initial_schema.sql + 002_search_embeddings_rpc.sql), RLS policies, auth pages (login/signup), middleware for session refresh
- **Phase 2** ✅ — Domain types, Supabase query helpers (datasets, columns, cells, cell-meta, processes, embeddings), Zustand stores (dataset-store, ui-store)
- **Phase 3** ✅ — Dataset list page, create dialog, CSV/JSON import, export (both formats), AutoDataset wizard
- **Phase 4** ✅ — Virtual-scrolled spreadsheet with @tanstack/react-virtual, column headers with badges, cell renderer (text, image, audio, JSON, generating skeleton, error), add column dialog, process form sidebar
- **Phase 5** ✅ — Full OpenAI integration: text-generation, image-generation (gpt-image-1), vision (GPT-4o), web-search (Responses API with fallback), embeddings (text-embedding-3-small), speech (tts-1), transcription (whisper-1). Streaming SSE generation endpoint with batch concurrency.
- **Phase 6** ✅ — AutoDataset wizard with LLM-guided column/prompt generation, speech & transcription task types
- **Phase 7** ✅ — Loading skeletons, error states via sonner toasts, settings page, dark mode

### The Core Feature

The prompt template system (`{{column_name}}` syntax) is fully operational. When you configure a dynamic column's prompt to reference other columns — like "Draw a picture of {{subject}} in the style of {{style}} for season {{season}}" — the generation engine:

1. Resolves column references to column IDs
2. For each row, fetches the values of referenced columns at that row index
3. Uses Mustache to template the prompt with those values
4. Calls the appropriate OpenAI endpoint (text, image, vision, etc.)
5. Streams results back via SSE

This means every row gets a unique output based on its own combination of input values across columns.

## What You Need to Do

### 1. Create a Supabase Project
- Go to https://supabase.com and create a new project
- Run the migrations in `supabase/migrations/` against your database (via Dashboard SQL editor or `supabase db push`)
- Copy your project URL and anon key

### 2. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key
```

### 3. Optional: Supabase Storage
For image generation and speech tasks that produce files, you may want to set up Supabase Storage buckets instead of using base64 data URIs (current approach works but is less efficient for large files).

Create a bucket called `dataset-files` with appropriate policies.

### 4. Deploy to Vercel
```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel deploy
```

Note: Generation endpoints may need Vercel Pro plan for >60s timeout (`maxDuration = 300` is set).

### 5. OpenAI API Key
Users enter their own OpenAI API key in Settings. It's stored in localStorage and sent via header with each request. Never touches the server's storage.

## Architecture Notes

### Prompt Templating Engine
Ported verbatim from the original `materialize-prompt.ts`. Uses Mustache with custom escape functions for BigInt handling. Supports:
- "From scratch" mode (no column references — deduplication via examples)
- "From data" mode (column references — per-row templating with examples)
- Sources context injection for web search
- Truncation to configurable token limits

### AutoDataset Parser
Ported from `run-autodataset.ts`. The LLM generates a structured config (dataset name, columns with prompts and types, search queries) which is parsed line-by-line with regex patterns.

### Batch Concurrency
Adapted from `cellGenerationInBatch`. Cells are processed in batches of MAX_CONCURRENCY (5), with Promise.all per batch. Results stream back via SSE as they complete.

### Realtime
Supabase Realtime subscription on `cell_values` table filtered by dataset_id. When cells are upserted (from generation or another tab), the UI updates automatically.

## Known Limitations / Future Work

1. **Supabase Storage for media** — Currently images/audio are stored as base64 data URIs in cell_values. For production, upload to Supabase Storage and store URLs instead.
2. **Drag-to-generate** — The use-cell-drag hook was spec'd but not implemented (requires more complex mouse interaction handling). The sidebar "Generate" button covers the core use case.
3. **Cell editing** — Static columns don't have inline editing yet. Can be added with a click-to-edit cell component.
4. **Supabase Realtime for column_cells** — Currently only cell_values are subscribed. Could also subscribe to column_cells for generating/error state sync across tabs.
5. **Row deletion** — Not yet implemented in the UI (schema supports it via cascade deletes).
