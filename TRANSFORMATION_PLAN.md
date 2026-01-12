# Brain Cells → Railway + Supabase Transformation Plan

## Executive Summary

Transform the single-user local Brain Cells application into a multi-tenant cloud platform hosted on Railway with Supabase for authentication and data storage.

---

## Phase 1: Supabase Project Setup & Schema Design

### 1.1 Create Supabase Project
- Create new Supabase project
- Note the project URL and anon/service keys
- Enable email/password authentication

### 1.2 Database Schema (Supabase Postgres)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth, but we reference it)
-- auth.users is automatically created by Supabase

-- Datasets (Spreadsheets)
CREATE TABLE public.datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Columns within datasets
CREATE TABLE public.columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    kind TEXT NOT NULL DEFAULT 'input',
    visible BOOLEAN DEFAULT TRUE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cells (actual data values)
CREATE TABLE public.cells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
    row_index INTEGER NOT NULL,
    value TEXT,
    error TEXT,
    generating BOOLEAN DEFAULT FALSE,
    validated BOOLEAN DEFAULT FALSE,
    sources JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(column_id, row_index)
);

-- Processes (AI column generation configs)
CREATE TABLE public.processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_provider TEXT NOT NULL DEFAULT 'huggingface',
    use_custom_endpoint BOOLEAN DEFAULT FALSE,
    search_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Process-Column references (for column dependencies)
CREATE TABLE public.process_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES public.columns(id) ON DELETE CASCADE,
    UNIQUE(process_id, column_id)
);

-- Indexes for performance
CREATE INDEX idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX idx_columns_dataset_id ON public.columns(dataset_id);
CREATE INDEX idx_cells_column_id ON public.cells(column_id);
CREATE INDEX idx_cells_column_row ON public.cells(column_id, row_index);
CREATE INDEX idx_processes_column_id ON public.processes(column_id);
```

### 1.3 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_columns ENABLE ROW LEVEL SECURITY;

-- Datasets: Users can only access their own datasets
CREATE POLICY "Users can view own datasets"
    ON public.datasets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own datasets"
    ON public.datasets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own datasets"
    ON public.datasets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own datasets"
    ON public.datasets FOR DELETE
    USING (auth.uid() = user_id);

-- Columns: Access through dataset ownership
CREATE POLICY "Users can view columns of own datasets"
    ON public.columns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets
            WHERE datasets.id = columns.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create columns in own datasets"
    ON public.columns FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.datasets
            WHERE datasets.id = columns.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update columns in own datasets"
    ON public.columns FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets
            WHERE datasets.id = columns.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete columns in own datasets"
    ON public.columns FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets
            WHERE datasets.id = columns.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

-- Cells: Access through column → dataset ownership
CREATE POLICY "Users can view cells of own datasets"
    ON public.cells FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = cells.column_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create cells in own datasets"
    ON public.cells FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = cells.column_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update cells in own datasets"
    ON public.cells FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = cells.column_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete cells in own datasets"
    ON public.cells FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = cells.column_id
            AND datasets.user_id = auth.uid()
        )
    );

-- Processes: Access through column → dataset ownership
CREATE POLICY "Users can view processes of own datasets"
    ON public.processes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = processes.column_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create processes in own datasets"
    ON public.processes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = processes.column_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update processes in own datasets"
    ON public.processes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = processes.column_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete processes in own datasets"
    ON public.processes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.columns
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE columns.id = processes.column_id
            AND datasets.user_id = auth.uid()
        )
    );

-- Process Columns: Access through process → column → dataset ownership
CREATE POLICY "Users can view process_columns of own datasets"
    ON public.process_columns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.processes
            JOIN public.columns ON columns.id = processes.column_id
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE processes.id = process_columns.process_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage process_columns in own datasets"
    ON public.process_columns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.processes
            JOIN public.columns ON columns.id = processes.column_id
            JOIN public.datasets ON datasets.id = columns.dataset_id
            WHERE processes.id = process_columns.process_id
            AND datasets.user_id = auth.uid()
        )
    );
```

### 1.4 Database Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER datasets_updated_at
    BEFORE UPDATE ON public.datasets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER columns_updated_at
    BEFORE UPDATE ON public.columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cells_updated_at
    BEFORE UPDATE ON public.cells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER processes_updated_at
    BEFORE UPDATE ON public.processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Get cell count for a column (used in UI)
CREATE OR REPLACE FUNCTION get_column_cell_count(col_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER FROM public.cells WHERE column_id = col_id;
$$ LANGUAGE sql STABLE;
```

---

## Phase 2: Supabase Auth Integration

### 2.1 Install Supabase Client

```bash
cd aisheets
npm install @supabase/supabase-js @supabase/ssr
```

### 2.2 New Files to Create

**`src/services/supabase/client.ts`** - Browser client
```typescript
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

**`src/services/supabase/server.ts`** - Server client for Qwik
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { RequestEvent } from '@builder.io/qwik-city';

export const createSupabaseServerClient = (event: RequestEvent) => {
  return createServerClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => event.cookie.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          event.cookie.set(name, value, {
            path: '/',
            secure: true,
            sameSite: 'lax',
            ...options,
          });
        },
        remove: (name: string, options: CookieOptions) => {
          event.cookie.delete(name, { path: '/', ...options });
        },
      },
    }
  );
};
```

### 2.3 Update Auth Plugin

Replace `src/routes/plugin@auth.ts`:
```typescript
import type { RequestEvent } from '@builder.io/qwik-city';
import { createSupabaseServerClient } from '~/services/supabase/server';

export const onRequest = async (event: RequestEvent) => {
  const { sharedMap, redirect, pathname } = event;

  const supabase = createSupabaseServerClient(event);
  const { data: { user }, error } = await supabase.auth.getUser();

  // Store supabase client and user in sharedMap
  sharedMap.set('supabase', supabase);
  sharedMap.set('user', user);

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/home', '/dataset'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected && !user) {
    throw redirect(302, '/auth');
  }
};
```

### 2.4 New Auth Routes

**`src/routes/auth/login/index.tsx`** - Login page
**`src/routes/auth/signup/index.tsx`** - Signup page
**`src/routes/auth/callback/index.ts`** - OAuth callback handler
**`src/routes/auth/logout/index.ts`** - Logout handler

---

## Phase 3: Data Layer Migration

### 3.1 Replace Sequelize with Supabase Client

**New Repository Pattern: `src/services/repository/supabase/`**

```typescript
// src/services/repository/supabase/datasets.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/supabase';

export const createDataset = async (
  supabase: SupabaseClient<Database>,
  name: string
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('datasets')
    .insert({ name, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getDatasets = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from('datasets')
    .select(`
      *,
      columns (
        id,
        name,
        type,
        kind,
        visible,
        position
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// ... more methods
```

### 3.2 Generate TypeScript Types

Use Supabase CLI to generate types:
```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts
```

### 3.3 Migration Checklist

Files to update (Sequelize → Supabase):
- [ ] `src/services/repository/datasets.ts`
- [ ] `src/services/repository/columns.ts`
- [ ] `src/services/repository/cells.ts`
- [ ] `src/services/repository/processes.ts`
- [ ] All loaders in `src/loaders/`
- [ ] All usecases in `src/usecases/`

### 3.4 Remove DuckDB Dependency

The current DuckDB is used for:
1. Google Sheets integration (via gsheets extension)
2. High-performance queries

For Postgres replacement:
- Google Sheets: Use Google Sheets API directly or pg_net extension
- Complex queries: Postgres is sufficient for spreadsheet operations

---

## Phase 4: Railway Deployment

### 4.1 Create Dockerfile

```dockerfile
# aisheets/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "server/entry.express.js"]
```

### 4.2 Railway Configuration

**`railway.json`**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "aisheets/Dockerfile"
  },
  "deploy": {
    "startCommand": "node server/entry.express.js",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4.3 Environment Variables for Railway

```env
# Supabase
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# HuggingFace (for inference)
HF_TOKEN=hf_xxx

# AI Models
DEFAULT_MODEL=meta-llama/Llama-3.3-70B-Instruct
DEFAULT_MODEL_PROVIDER=nebius

# Web Search (optional)
SERPER_API_KEY=xxx

# App Config
NODE_ENV=production
PORT=3000
```

---

## Phase 5: Code Refactoring Tasks

### 5.1 Files to Delete
- `src/services/db/db.ts` (SQLite)
- `src/services/db/duckdb.ts`
- `src/services/db/models/` (all Sequelize models)
- `src/services/auth/session.ts` (HF OAuth)

### 5.2 Files to Create
```
src/
├── services/
│   └── supabase/
│       ├── client.ts          # Browser client
│       ├── server.ts          # Server client
│       └── admin.ts           # Service role client (for background jobs)
├── types/
│   └── supabase.ts            # Generated types
└── routes/
    └── auth/
        ├── login/index.tsx    # Login page
        ├── signup/index.tsx   # Signup page
        └── logout/index.ts    # Logout handler
```

### 5.3 Files to Update
| File | Changes |
|------|---------|
| `src/config.ts` | Remove data paths, add Supabase config |
| `src/routes/plugin@auth.ts` | Replace HF OAuth with Supabase |
| `src/routes/layout.tsx` | Update auth context |
| `src/routes/home/index.tsx` | Use Supabase queries |
| `src/routes/home/dataset/[id]/index.tsx` | Use Supabase queries |
| `src/loaders/*.ts` | Replace Sequelize with Supabase |
| `src/usecases/*.ts` | Replace repository calls |
| `src/features/main-sidebar/main-sidebar.tsx` | Update auth UI |
| `src/components/ui/login/Login.tsx` | Supabase auth UI |

---

## Phase 6: Testing & Validation

### 6.1 Local Testing Checklist
- [ ] User can sign up with email/password
- [ ] User can log in
- [ ] User can create a new dataset
- [ ] User can add columns to dataset
- [ ] User can add/edit cells
- [ ] User can run AI generation on columns
- [ ] User cannot see other users' datasets
- [ ] User can log out

### 6.2 Security Validation
- [ ] RLS policies block unauthorized access
- [ ] API keys are not exposed to client
- [ ] CORS is properly configured
- [ ] Session tokens are secure

---

## Estimated Work Breakdown

| Phase | Tasks | Complexity |
|-------|-------|------------|
| 1. Supabase Setup | Schema, RLS, triggers | Medium |
| 2. Auth Integration | Supabase Auth, routes | Medium |
| 3. Data Migration | Repository refactor | High |
| 4. Railway Deploy | Dockerfile, config | Low |
| 5. Code Refactor | Update all files | High |
| 6. Testing | E2E validation | Medium |

---

## Next Steps

1. **Create Supabase project** (or connect existing one)
2. **Run schema migrations** via Supabase dashboard or CLI
3. **Begin code migration** starting with auth layer
4. **Test locally** with Supabase
5. **Deploy to Railway** with environment variables

Would you like to proceed with Phase 1 (Supabase setup)?
