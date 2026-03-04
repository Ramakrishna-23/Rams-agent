# Rams Agent — GCP Deployment Guide

Deploy the full Rams Agent stack (FastAPI backend, Next.js frontend, Chrome extension) to Google Cloud Platform using Cloud Run, Cloud SQL, and Neo4j AuraDB.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Cost Estimate](#cost-estimate)
4. [Phase 1: GCP Project Setup](#phase-1-gcp-project-setup)
5. [Phase 2: Cloud SQL + pgvector](#phase-2-cloud-sql--pgvector)
6. [Phase 3: Secret Manager](#phase-3-secret-manager)
7. [Phase 4: Deploy Backend](#phase-4-deploy-backend)
8. [Phase 5: Database Migrations](#phase-5-database-migrations)
9. [Phase 6: Deploy Frontend](#phase-6-deploy-frontend)
10. [Phase 7: Custom Domains](#phase-7-custom-domains)
11. [Phase 8: DNS Configuration](#phase-8-dns-configuration)
12. [Chrome Extension Setup](#chrome-extension-setup)
13. [CI/CD with GitHub Actions](#cicd-with-github-actions)
14. [Automated Deployment Script](#automated-deployment-script)
15. [Verification Checklist](#verification-checklist)
16. [Troubleshooting](#troubleshooting)
17. [Updating & Redeploying](#updating--redeploying)

---

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │          rambuilds.dev (DNS)         │
                    │  rams.rambuilds.dev → Frontend       │
                    │  api.rams.rambuilds.dev → Backend    │
                    └──────┬──────────────┬───────────────┘
                           │              │
                    ┌──────▼──────┐ ┌─────▼──────┐
                    │  Cloud Run  │ │  Cloud Run  │
                    │  Frontend   │ │  Backend    │
                    │  (Next.js)  │ │  (FastAPI)  │
                    │  port 3000  │ │  port 8000  │
                    │  256Mi/1CPU │ │  512Mi/1CPU │
                    │  0-2 inst.  │ │  0-3 inst.  │
                    └─────────────┘ └──┬─────┬───┘
                                       │     │
                              ┌────────▼┐  ┌─▼──────────┐
                              │Cloud SQL│  │Neo4j AuraDB│
                              │Postgres │  │  (optional) │
                              │+pgvector│  │  Knowledge  │
                              │ f1-micro│  │    Graph    │
                              └─────────┘  └─────────────┘

    ┌──────────────────┐
    │ Chrome Extension │──── HTTPS ────► api.rams.rambuilds.dev
    │ (extension-v2)   │
    └──────────────────┘

    Secrets: GCP Secret Manager
    Images:  Artifact Registry (us-central1-docker.pkg.dev)
    CI/CD:   GitHub Actions + Workload Identity Federation
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| **GCP Account** | With billing enabled |
| **gcloud CLI** | [Install](https://cloud.google.com/sdk/docs/install), then `gcloud auth login` |
| **Docker** | Needed for frontend build (build args for `NEXT_PUBLIC_*`) |
| **Domain** | `rambuilds.dev` (or your own) with DNS access |
| **API Keys** | Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) |
| **Neo4j AuraDB** | (Optional) Free tier at [Neo4j Aura](https://neo4j.com/cloud/aura-free/) |
| **Node.js 20+** | For Chrome extension build |
| **pnpm** | For frontend (`corepack enable`) |

---

## Cost Estimate

Running with minimum instances set to 0 (scale-to-zero):

| Service | Spec | Est. Monthly Cost |
|---|---|---|
| Cloud Run — Backend | 512Mi / 1 vCPU, 0-3 instances | $0–5 |
| Cloud Run — Frontend | 256Mi / 1 vCPU, 0-2 instances | $0–3 |
| Cloud SQL — PostgreSQL | `db-f1-micro`, 10GB HDD | ~$8 |
| Artifact Registry | Container storage | ~$1 |
| Secret Manager | 5-7 secrets | < $0.10 |
| Neo4j AuraDB | Free tier | $0 |
| **Total** | | **~$8–18/month** |

> Cloud Run's free tier includes 2M requests/month and 360k vCPU-seconds. Light personal use may stay within free tier for compute.

---

## Phase 1: GCP Project Setup

### 1.1 Set your project

```bash
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="us-central1"

gcloud config set project "$GCP_PROJECT_ID"
```

### 1.2 Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

### 1.3 Create Artifact Registry repository

```bash
gcloud artifacts repositories create rams-agent \
  --repository-format=docker \
  --location="$GCP_REGION" \
  --description="Rams Agent container images"
```

### 1.4 Configure Docker authentication

```bash
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet
```

---

## Phase 2: Cloud SQL + pgvector

### 2.1 Create the instance

This takes ~5 minutes:

```bash
gcloud sql instances create rams-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region="$GCP_REGION" \
  --storage-size=10GB \
  --storage-type=HDD \
  --no-assign-ip \
  --enable-google-private-path
```

> `--no-assign-ip` means no public IP — Cloud Run connects via the Cloud SQL Auth Proxy over a Unix socket, which is more secure.

### 2.2 Set the postgres password

```bash
gcloud sql users set-password postgres \
  --instance=rams-db \
  --password="YOUR_SECURE_PASSWORD"
```

### 2.3 Create the database

```bash
gcloud sql databases create resources_db --instance=rams-db
```

### 2.4 Enable the pgvector extension

Connect to the instance:

```bash
gcloud sql connect rams-db --user=postgres --database=resources_db
```

Then run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

### 2.5 Note the connection name

```bash
gcloud sql instances describe rams-db --format='value(connectionName)'
# Output: your-project:us-central1:rams-db
```

Save this — you'll need it for the database URL.

---

## Phase 3: Secret Manager

The backend reads secrets as environment variables. Cloud Run injects them from Secret Manager at runtime.

### 3.1 Required secrets

| Secret Name | Value |
|---|---|
| `gemini-api-key` | Your Gemini API key |
| `api-key` | A strong random string for backend auth (used by frontend + extension) |
| `database-url` | `postgresql+asyncpg://postgres:PASSWORD@/resources_db?host=/cloudsql/PROJECT:REGION:rams-db` |
| `neo4j-uri` | (Optional) `neo4j+s://xxxx.databases.neo4j.io` |
| `neo4j-password` | (Optional) Neo4j AuraDB password |

### 3.2 Create secrets

```bash
# Generate a strong API key
API_KEY=$(openssl rand -base64 32)
echo "Your API key: $API_KEY"

# Get connection name
CLOUD_SQL_CONN=$(gcloud sql instances describe rams-db --format='value(connectionName)')

# Database URL using Cloud SQL Unix socket
DB_URL="postgresql+asyncpg://postgres:YOUR_PASSWORD@/resources_db?host=/cloudsql/${CLOUD_SQL_CONN}"

# Create each secret
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "$API_KEY" | gcloud secrets create api-key --data-file=-
echo -n "$DB_URL" | gcloud secrets create database-url --data-file=-

# Optional: Neo4j
echo -n "neo4j+s://xxxx.databases.neo4j.io" | gcloud secrets create neo4j-uri --data-file=-
echo -n "YOUR_NEO4J_PASSWORD" | gcloud secrets create neo4j-password --data-file=-
```

### 3.3 Grant Cloud Run access to secrets

```bash
PROJECT_NUM=$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectNumber)')
SA_EMAIL="${PROJECT_NUM}-compute@developer.gserviceaccount.com"

for SECRET in gemini-api-key api-key database-url neo4j-uri neo4j-password; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" --quiet
done
```

---

## Phase 4: Deploy Backend

### 4.1 Build with Cloud Build

```bash
REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/rams-agent"
TAG="${REGISTRY}/rams-backend:$(git rev-parse --short HEAD)"

gcloud builds submit ./backend --tag "$TAG" --quiet
```

> This uses the `backend/Dockerfile` (Python 3.12-slim, uvicorn on port 8000).

### 4.2 Deploy to Cloud Run

```bash
CLOUD_SQL_CONN=$(gcloud sql instances describe rams-db --format='value(connectionName)')

gcloud run deploy rams-backend \
  --image "$TAG" \
  --region "$GCP_REGION" \
  --port 8000 \
  --memory 512Mi --cpu 1 \
  --min-instances 0 --max-instances 3 \
  --allow-unauthenticated \
  --add-cloudsql-instances "$CLOUD_SQL_CONN" \
  --set-secrets "DATABASE_URL=database-url:latest,GEMINI_API_KEY=gemini-api-key:latest,API_KEY=api-key:latest,NEO4J_URI=neo4j-uri:latest,NEO4J_PASSWORD=neo4j-password:latest" \
  --set-env-vars 'NEO4J_USERNAME=neo4j,NEO4J_DATABASE=neo4j,DEBUG=false,ALLOWED_ORIGINS=["https://rams.rambuilds.dev","chrome-extension://*"]'
```

### 4.3 Verify

```bash
BACKEND_URL=$(gcloud run services describe rams-backend \
  --region "$GCP_REGION" --format='value(status.url)')

curl "${BACKEND_URL}/health"
# {"status":"ok"}
```

---

## Phase 5: Database Migrations

Run Alembic migrations via a Cloud Run Job:

### 5.1 Create the migration job

```bash
CLOUD_SQL_CONN=$(gcloud sql instances describe rams-db --format='value(connectionName)')
TAG="${REGISTRY}/rams-backend:$(git rev-parse --short HEAD)"

gcloud run jobs create rams-migrate \
  --image "$TAG" \
  --region "$GCP_REGION" \
  --add-cloudsql-instances "$CLOUD_SQL_CONN" \
  --set-secrets "DATABASE_URL=database-url:latest" \
  --command "alembic" --args "upgrade,head"
```

### 5.2 Execute

```bash
gcloud run jobs execute rams-migrate --region "$GCP_REGION" --wait
```

### 5.3 For future migrations

Update the job image and re-execute:

```bash
gcloud run jobs update rams-migrate \
  --image "$NEW_TAG" \
  --region "$GCP_REGION"

gcloud run jobs execute rams-migrate --region "$GCP_REGION" --wait
```

---

## Phase 6: Deploy Frontend

The frontend requires build-time environment variables (`NEXT_PUBLIC_*`), so it must be built locally or in CI with Docker — not with Cloud Build.

### 6.1 Build the Docker image

```bash
TAG="${REGISTRY}/rams-frontend:$(git rev-parse --short HEAD)"

# Retrieve the production API key
PROD_API_KEY=$(gcloud secrets versions access latest --secret=api-key)

docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://api.rams.rambuilds.dev" \
  --build-arg NEXT_PUBLIC_API_KEY="$PROD_API_KEY" \
  -t "$TAG" \
  ./frontend
```

> The `frontend/Dockerfile` uses a multi-stage build: Node 20 Alpine, pnpm, Next.js standalone output, serves on port 3000.

### 6.2 Push to Artifact Registry

```bash
docker push "$TAG"
```

### 6.3 Deploy to Cloud Run

```bash
gcloud run deploy rams-frontend \
  --image "$TAG" \
  --region "$GCP_REGION" \
  --port 3000 \
  --memory 256Mi --cpu 1 \
  --min-instances 0 --max-instances 2 \
  --allow-unauthenticated
```

### 6.4 Verify

```bash
FRONTEND_URL=$(gcloud run services describe rams-frontend \
  --region "$GCP_REGION" --format='value(status.url)')

echo "Frontend: $FRONTEND_URL"
```

---

## Phase 7: Custom Domains

Map your custom domains to the Cloud Run services:

```bash
# Frontend: rams.rambuilds.dev
gcloud run domain-mappings create \
  --service rams-frontend \
  --domain rams.rambuilds.dev \
  --region "$GCP_REGION"

# Backend: api.rams.rambuilds.dev
gcloud run domain-mappings create \
  --service rams-backend \
  --domain api.rams.rambuilds.dev \
  --region "$GCP_REGION"
```

---

## Phase 8: DNS Configuration

Add these CNAME records at your DNS provider (Vercel, Netlify, Cloudflare, etc.):

| Type | Name | Value |
|---|---|---|
| CNAME | `rams` | `ghs.googlehosted.com.` |
| CNAME | `api.rams` | `ghs.googlehosted.com.` |

> If your DNS provider manages `rambuilds.dev`, the "Name" field is relative to the zone. For example, at Vercel, add `rams` as a CNAME pointing to `ghs.googlehosted.com.`

TLS certificates are automatically provisioned by Google. Allow 15–30 minutes after DNS propagation.

### Verify DNS

```bash
dig rams.rambuilds.dev CNAME +short
# ghs.googlehosted.com.

dig api.rams.rambuilds.dev CNAME +short
# ghs.googlehosted.com.
```

### Verify TLS

```bash
curl -I https://api.rams.rambuilds.dev/health
# HTTP/2 200

curl -I https://rams.rambuilds.dev
# HTTP/2 200
```

---

## Chrome Extension Setup

The Chrome extension (`extension-v2/`) connects to the backend API via a configurable URL stored in `chrome.storage.sync`.

### Build the extension

```bash
cd extension-v2
npm install
npm run build    # webpack --mode production
```

The built files will be in `extension-v2/dist/`.

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension-v2/dist` folder

### Configure for production

1. Click the Rams Agent extension icon
2. Go to the **Options** page (or right-click → Options)
3. Set:
   - **Backend URL**: `https://api.rams.rambuilds.dev`
   - **API Key**: your production API key (same value as the `api-key` secret)
4. Click **Save**

> The extension uses the `X-API-Key` header for authentication. The backend's CORS config includes `chrome-extension://*` so requests from the extension are allowed.

### Keyboard shortcut

- **Windows/Linux**: `Alt+R`
- **Mac**: `Ctrl+R` (MacCtrl+R)

---

## CI/CD with GitHub Actions

The project includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that auto-deploys on push to `main`.

### How it works

- Uses `dorny/paths-filter` to detect changes in `backend/` and `frontend/`
- Only deploys the service(s) that changed
- Authenticates via **Workload Identity Federation** (no service account keys)
- Backend builds use Cloud Build; frontend builds use Docker in the runner

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `WIF_PROVIDER` | Workload Identity Provider resource name |
| `WIF_SERVICE_ACCOUNT` | Service account email for WIF |

### Set up Workload Identity Federation

```bash
# Create a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create a Provider for GitHub
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get the full provider resource name (set as WIF_PROVIDER secret)
gcloud iam workload-identity-pools providers describe "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
# Output: projects/PROJECT_NUM/locations/global/workloadIdentityPools/github-pool/providers/github-provider

# Create a service account for deployments
gcloud iam service-accounts create github-deploy \
  --display-name="GitHub Actions Deploy"

SA_EMAIL="github-deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary roles
for ROLE in roles/run.admin roles/cloudbuild.builds.editor roles/artifactregistry.writer roles/iam.serviceAccountUser roles/cloudsql.client roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$ROLE"
done

# Allow GitHub Actions to impersonate this SA
REPO="YOUR_GITHUB_USERNAME/Rams_agent"  # change this

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe $GCP_PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
```

Then set these GitHub secrets:

- `GCP_PROJECT_ID`: your project ID
- `WIF_PROVIDER`: the full provider name from above
- `WIF_SERVICE_ACCOUNT`: `github-deploy@YOUR_PROJECT.iam.gserviceaccount.com`

---

## Automated Deployment Script

The `deploy.sh` script automates all phases. It prompts for secrets interactively.

### Run all phases

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"   # optional, defaults to us-central1

./deploy.sh
```

### Run a specific phase

```bash
./deploy.sh --phase 4    # Only deploy backend
./deploy.sh --phase 6    # Only deploy frontend
```

### Run from a phase onward

```bash
./deploy.sh --from-phase 3   # Run phases 3, 4, 5, 6, 7, 8
```

### Phase summary

| Phase | Action |
|---|---|
| 1 | Enable APIs, create Artifact Registry |
| 2 | Create Cloud SQL instance, enable pgvector |
| 3 | Create/update secrets in Secret Manager |
| 4 | Build & deploy backend to Cloud Run |
| 5 | Run Alembic database migrations |
| 6 | Build & deploy frontend to Cloud Run |
| 7 | Map custom domains |
| 8 | Print DNS instructions & verification commands |

---

## Verification Checklist

After deployment, verify each component:

### Backend health

```bash
curl https://api.rams.rambuilds.dev/health
# {"status":"ok"}
```

### Backend auth

```bash
curl -H "X-API-Key: YOUR_API_KEY" https://api.rams.rambuilds.dev/resources?page=1&page_size=1
# {"items":[],"total":0,"page":1,"page_size":1}
```

### Frontend

Open https://rams.rambuilds.dev in your browser — you should see the Rams Agent UI.

### Chrome extension

1. Open the extension popup
2. Try saving a resource from any webpage
3. Test the search tab
4. Open the side panel and test chat

### Graph stats (if Neo4j is configured)

```bash
curl -H "X-API-Key: YOUR_API_KEY" https://api.rams.rambuilds.dev/graph/stats
```

---

## Troubleshooting

### pgvector extension not found

**Symptom**: Backend logs show `extension "vector" is not available`

**Fix**: Connect to Cloud SQL and create the extension manually:

```bash
gcloud sql connect rams-db --user=postgres --database=resources_db
```

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### CORS errors in browser/extension

**Symptom**: `Access-Control-Allow-Origin` errors in console

**Check**: The backend's `ALLOWED_ORIGINS` env var must include the frontend domain and `chrome-extension://*`:

```bash
gcloud run services describe rams-backend \
  --region us-central1 \
  --format='yaml(spec.template.spec.containers[0].env)'
```

**Fix**: Update if needed:

```bash
gcloud run services update rams-backend \
  --region us-central1 \
  --set-env-vars 'ALLOWED_ORIGINS=["https://rams.rambuilds.dev","chrome-extension://*"]'
```

### DNS not resolving / TLS errors

**Symptom**: `ERR_NAME_NOT_RESOLVED` or certificate errors

**Causes**:
- DNS records not added yet — check with `dig rams.rambuilds.dev CNAME +short`
- DNS propagation — wait 15-30 minutes
- Domain mapping not verified — check `gcloud run domain-mappings list --region us-central1`

### Cold start latency

**Symptom**: First request after idle takes 5-10 seconds

**Cause**: `min-instances 0` means Cloud Run scales to zero when idle.

**Fix**: Set `--min-instances 1` on the backend (adds ~$5-10/month):

```bash
gcloud run services update rams-backend \
  --region us-central1 \
  --min-instances 1
```

### Cloud SQL connection refused

**Symptom**: Backend logs show `connection refused` to database

**Check**:
1. Cloud SQL instance is running: `gcloud sql instances describe rams-db --format='value(state)'`
2. The `--add-cloudsql-instances` flag was set during deploy
3. The `DATABASE_URL` secret uses the Unix socket format: `postgresql+asyncpg://postgres:PASS@/resources_db?host=/cloudsql/PROJECT:REGION:rams-db`

### Migration job fails

**Symptom**: `gcloud run jobs execute rams-migrate` exits with error

**Debug**:

```bash
gcloud run jobs executions list --job rams-migrate --region us-central1
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=rams-migrate" --limit=20
```

### Frontend shows blank page

**Check**: The `NEXT_PUBLIC_API_URL` build arg was set correctly during the Docker build. This is baked in at build time and cannot be changed at runtime.

**Fix**: Rebuild and redeploy:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://api.rams.rambuilds.dev" \
  --build-arg NEXT_PUBLIC_API_KEY="YOUR_KEY" \
  -t "$TAG" \
  ./frontend
docker push "$TAG"
gcloud run deploy rams-frontend --image "$TAG" --region us-central1
```

---

## Updating & Redeploying

### Backend only

```bash
export GCP_PROJECT_ID="your-project-id"
./deploy.sh --phase 4   # rebuild + deploy backend
./deploy.sh --phase 5   # run migrations (if schema changed)
```

Or manually:

```bash
REGISTRY="us-central1-docker.pkg.dev/${GCP_PROJECT_ID}/rams-agent"
TAG="${REGISTRY}/rams-backend:$(git rev-parse --short HEAD)"

gcloud builds submit ./backend --tag "$TAG" --quiet
gcloud run deploy rams-backend --image "$TAG" --region us-central1
```

### Frontend only

```bash
./deploy.sh --phase 6
```

### Both

```bash
./deploy.sh --from-phase 4
```

### Via CI/CD

Just push to `main`. GitHub Actions will detect which services changed and deploy them automatically.

```bash
git add -A
git commit -m "your changes"
git push origin main
```

### Updating secrets

```bash
echo -n "new-value" | gcloud secrets versions add gemini-api-key --data-file=-

# Redeploy to pick up the new secret version
gcloud run services update rams-backend --region us-central1
```

### Rollback

```bash
# List revisions
gcloud run revisions list --service rams-backend --region us-central1

# Route traffic to a previous revision
gcloud run services update-traffic rams-backend \
  --region us-central1 \
  --to-revisions=rams-backend-REVISION_ID=100
```
