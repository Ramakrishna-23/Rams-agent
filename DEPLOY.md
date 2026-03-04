# Rams Agent — Railway Deployment Guide

Deploy the full Rams Agent stack (FastAPI backend, Next.js frontend, Chrome extension) to Railway with Cloudflare DNS/CDN, Railway PostgreSQL, and Neo4j AuraDB.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Cost Estimate](#cost-estimate)
4. [Phase 1: Railway Project Setup](#phase-1-railway-project-setup)
5. [Phase 2: PostgreSQL with pgvector](#phase-2-postgresql-with-pgvector)
6. [Phase 3: Neo4j AuraDB](#phase-3-neo4j-auradb)
7. [Phase 4: Deploy Backend](#phase-4-deploy-backend)
8. [Phase 5: Deploy Frontend](#phase-5-deploy-frontend)
9. [Phase 6: Cloudflare DNS Setup](#phase-6-cloudflare-dns-setup)
10. [Phase 7: S3 / Object Storage](#phase-7-s3--object-storage)
11. [Chrome Extension Setup](#chrome-extension-setup)
12. [CI/CD](#cicd)
13. [Verification Checklist](#verification-checklist)
14. [Troubleshooting](#troubleshooting)
15. [Updating & Redeploying](#updating--redeploying)

---

## Architecture

```
         Cloudflare (Free DNS/CDN)
  rams.rambuilds.dev  -->  Railway Frontend (Next.js :3000)
  api.rams.rambuilds.dev  -->  Railway Backend (FastAPI :8000)
                                    |           |
                              Railway Postgres   Neo4j AuraDB
                              (pgvector)         (Free Tier)

    ┌──────────────────┐
    │ Chrome Extension │──── HTTPS ────► api.rams.rambuilds.dev
    │ (extension-v2)   │
    └──────────────────┘

    CI: GitHub Actions (lint + typecheck only)
    CD: Railway auto-deploy on push to main
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| **Railway Account** | Hobby Plan ($5/month + usage) at [railway.app](https://railway.app) |
| **Railway CLI** | `npm i -g @railway/cli && railway login` |
| **Domain** | `rambuilds.dev` (or your own) with DNS access |
| **Cloudflare Account** | Free tier at [cloudflare.com](https://cloudflare.com) |
| **API Keys** | Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) |
| **Neo4j AuraDB** | Free tier at [console.neo4j.io](https://console.neo4j.io) |
| **Node.js 20+** | For Chrome extension build |
| **pnpm** | For frontend (`corepack enable`) |

---

## Cost Estimate

| Service | Est. Monthly Cost |
|---|---|
| Railway Hobby Plan | $5 base |
| Backend compute | $2-5 |
| Frontend compute | $1-3 |
| PostgreSQL | $1-3 |
| Neo4j AuraDB | $0 (free tier) |
| Cloudflare | $0 (free tier) |
| **Total** | **~$9-16/month** |

---

## Phase 1: Railway Project Setup

1. Create a Railway account and subscribe to the **Hobby Plan** ($5/month + usage)
2. Create a new project named `rams-agent`
3. Install the Railway CLI:

```bash
npm i -g @railway/cli
railway login
railway link  # select your rams-agent project
```

---

## Phase 2: PostgreSQL with pgvector

Railway's PostgreSQL 16 plugin includes pgvector out of the box.

### 2.1 Add PostgreSQL plugin

In the Railway dashboard, click **+ New** → **Database** → **PostgreSQL**. Name it `rams-postgres`.

### 2.2 Enable pgvector

Connect to the database and enable the extension:

```bash
railway connect postgres
```

```sql
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 2.3 Database URL

The backend `DATABASE_URL` should use Railway variable references. Set this on the backend service:

```
postgresql+asyncpg://${{rams-postgres.PGUSER}}:${{rams-postgres.PGPASSWORD}}@${{rams-postgres.PGHOST}}:${{rams-postgres.PGPORT}}/${{rams-postgres.PGDATABASE}}
```

---

## Phase 3: Neo4j AuraDB

### Why AuraDB Free

- Zero cost, fully managed
- 200K nodes / 400K relationships (plenty for personal use)
- Pauses after 3 days idle — the backend code handles this gracefully (try/except in `rag.py`)

### Setup

1. Go to [console.neo4j.io](https://console.neo4j.io)
2. Create a free instance
3. Save the connection URI, username, and password

---

## Phase 4: Deploy Backend

### 4.1 Add backend service

In Railway dashboard, click **+ New** → **GitHub Repo** → select your repo. Set the **root directory** to `backend/`.

### 4.2 Set start command

In the service settings, set the start command:

```
chmod +x start.sh && ./start.sh
```

Or alternatively:

```
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4.3 Set environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://${{rams-postgres.PGUSER}}:${{rams-postgres.PGPASSWORD}}@${{rams-postgres.PGHOST}}:${{rams-postgres.PGPORT}}/${{rams-postgres.PGDATABASE}}` |
| `GEMINI_API_KEY` | From Google AI Studio |
| `API_KEY` | Generate with `openssl rand -base64 32` |
| `NEO4J_URI` | AuraDB connection URI (e.g. `neo4j+s://xxxx.databases.neo4j.io`) |
| `NEO4J_USERNAME` | `neo4j` |
| `NEO4J_PASSWORD` | AuraDB password |
| `NEO4J_DATABASE` | `neo4j` |
| `DEBUG` | `false` |
| `ALLOWED_ORIGINS` | `["https://rams.rambuilds.dev","chrome-extension://*"]` |

### 4.4 Set health check

Set the health check path to `/health` in the service settings.

### 4.5 Verify

```bash
curl <railway-backend-url>/health
# {"status":"ok"}
```

---

## Phase 5: Deploy Frontend

### 5.1 Add frontend service

In Railway dashboard, click **+ New** → **GitHub Repo** → select your repo. Set the **root directory** to `frontend/`.

### 5.2 Set environment variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.rams.rambuilds.dev` |
| `NEXT_PUBLIC_API_KEY` | Same as backend `API_KEY` |

The `frontend/railway.toml` ensures these are passed as Docker build args automatically.

### 5.3 Verify

Open the Railway-generated URL in your browser — you should see the Rams Agent UI.

---

## Phase 6: Cloudflare DNS Setup

### 6.1 Add domain to Cloudflare

1. Add `rambuilds.dev` to your Cloudflare account
2. Update nameservers at your registrar to Cloudflare's

### 6.2 Add custom domains on Railway

In each Railway service's settings, add a custom domain. Railway will give you a CNAME target.

### 6.3 Create DNS records

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `rams` | `<railway-frontend>.up.railway.app` | Proxied |
| CNAME | `api.rams` | `<railway-backend>.up.railway.app` | Proxied |

### 6.4 Configure SSL/TLS

- Set SSL/TLS mode to **Full (Strict)**

### 6.5 Recommended settings

- **Page Rule**: `api.rams.rambuilds.dev/*` → Cache Level: Bypass
- **Always Use HTTPS**: On
- **Brotli**: On
- **Auto Minify**: On

### Verify DNS

```bash
dig rams.rambuilds.dev CNAME +short
dig api.rams.rambuilds.dev CNAME +short
```

---

## Phase 7: S3 / Object Storage

**Not needed now.** All content is stored in PostgreSQL (scraped text, embeddings, search vectors).

**When needed later, use Cloudflare R2:**

- Free tier: 10GB storage, 10M reads, 1M writes/month, zero egress
- S3-compatible API (works with boto3)
- Already using Cloudflare = single vendor
- Use cases: screenshots, PDF uploads, database backups

---

## Chrome Extension Setup

The Chrome extension (`extension-v2/`) connects to the backend API.

### Build

```bash
cd extension-v2
npm install
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `extension-v2/dist`

### Configure

1. Click the extension icon → Options
2. Set **Backend URL**: `https://api.rams.rambuilds.dev`
3. Set **API Key**: your production API key
4. Save

---

## CI/CD

**Railway handles deploys automatically** — pushing to `main` triggers a build and deploy for each service. No GitHub Actions needed for deployment.

The `.github/workflows/ci.yml` workflow runs linting and type checking on push/PR:

- **Backend**: `ruff check`
- **Frontend**: `eslint` + `tsc --noEmit`

---

## Verification Checklist

```bash
# 1. Backend health
curl https://api.rams.rambuilds.dev/health
# {"status":"ok"}

# 2. Backend auth
curl -H "X-API-Key: YOUR_API_KEY" "https://api.rams.rambuilds.dev/resources?page=1&page_size=1"

# 3. Frontend
open https://rams.rambuilds.dev

# 4. Chrome extension: save a resource + test search

# 5. Graph stats
curl -H "X-API-Key: YOUR_API_KEY" https://api.rams.rambuilds.dev/graph/stats
```

---

## Troubleshooting

### pgvector extension not found

**Symptom**: Backend logs show `extension "vector" is not available`

**Fix**: Connect and create the extension:

```bash
railway connect postgres
```

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### CORS errors

**Check**: Ensure `ALLOWED_ORIGINS` env var on the backend includes `https://rams.rambuilds.dev` and `chrome-extension://*`.

### DNS not resolving / TLS errors

- Verify CNAME records with `dig rams.rambuilds.dev CNAME +short`
- Ensure Cloudflare SSL/TLS is set to **Full (Strict)**
- Allow 15-30 minutes for DNS propagation

### Frontend shows blank page

The `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_KEY` are baked in at build time. If they're wrong, trigger a redeploy after updating the env vars in Railway.

### Neo4j connection timeout

AuraDB free tier pauses after 3 days of inactivity. The first request after a pause may take 30-60 seconds while the instance resumes. The backend handles this gracefully.

### Cold start latency

Railway services may have brief cold starts if they scale to zero. This is expected on the Hobby plan.

---

## Updating & Redeploying

### Automatic

Push to `main` — Railway auto-deploys both services (only rebuilds what changed).

```bash
git push origin main
```

### Manual redeploy

In the Railway dashboard, click the service → **Deploy** → **Redeploy**.

### Updating environment variables

Change the variable in the Railway dashboard. Railway automatically redeploys the service.

### Rollback

In the Railway dashboard, go to the service's **Deployments** tab and click **Rollback** on a previous deployment.
