# Rams Agent — CLAUDE.md

Personal knowledge management app: save resources via Chrome extension or quick-save URL, organize them as readings or actions, chat with your knowledge base, and review via spaced repetition.

## Architecture

```
frontend/          Next.js 16 + Tailwind + shadcn/ui (rams.rambuilds.dev)
backend/           FastAPI + SQLAlchemy async + pgvector (api-rams.rambuilds.dev)
extension-v2/      Chrome extension (TypeScript, Manifest V3)
```

**Databases:** PostgreSQL with pgvector (Railway) + Neo4j AuraDB (graph layer)

**AI:** Google Gemini via `google-adk` and `google-genai`

**Deploy:** Railway auto-deploys on push to `main`. Cloudflare handles DNS/CDN.

## Dev Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Requires env vars: `DATABASE_URL`, `GEMINI_API_KEY`, `API_KEY`, `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`

### Frontend

```bash
cd frontend
pnpm install
pnpm dev   # runs on :3000
```

Requires env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_KEY`

### Chrome Extension

```bash
cd extension-v2
npm install
npm run build   # outputs to dist/
```

Load `dist/` as unpacked extension in `chrome://extensions/`.

## Key Directories

| Path | Purpose |
|---|---|
| `backend/app/routers/` | API routes: resources, subtasks, chat, search, digest, graph, push, reminders |
| `backend/app/models/` | SQLAlchemy models |
| `backend/app/services/` | Business logic (AI, scraping, embeddings) |
| `backend/app/agents/` | Google ADK agents |
| `backend/alembic/` | DB migrations — always run `alembic upgrade head` after pulling |
| `frontend/app/` | Next.js pages: inbox, resources, actions, chat, digest, save |
| `frontend/components/` | Shared UI components |
| `frontend/components/ui/` | shadcn/ui primitives |
| `frontend/lib/types.ts` | Shared TypeScript types (Resource, Tag, Subtask, statuses) |
| `frontend/lib/api.ts` | API client |

## Resource Model

Resources have two modes: **reading** (statuses: unread → read → favorite → archived) and **action** (statuses: about_to_do → lets_do → doing → done → archive). A resource starts in `inbox` and can be triaged to either mode via the `isActionResource()` helper.

## API Auth

All API calls require `X-API-Key` header. The key is set via the `API_KEY` env var on the backend and `NEXT_PUBLIC_API_KEY` on the frontend.

## Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Deployment

Push to `main` → Railway auto-deploys both services. No manual steps needed.

```bash
git push origin main
railway status --json   # check deploy status
```

Custom domains: `rams.rambuilds.dev` (frontend), `api-rams.rambuilds.dev` (backend)

## UI Conventions

- Component library: **shadcn/ui** (components live in `frontend/components/ui/`)
- Add new shadcn components via: `pnpm dlx shadcn add <component>`
- Styling: Tailwind v4, no `cn()` needed for simple cases
- Resource detail view: centered `Dialog` modal (not a side Sheet)
- Icons: `lucide-react`
