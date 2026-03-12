#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Rams Agent — GCP Deployment Script
# =============================================================================
# Deploys backend (FastAPI) and frontend (Next.js) to Cloud Run,
# with Cloud SQL (PostgreSQL + pgvector) and Secret Manager.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (`gcloud auth login`)
#   - Docker installed (for frontend build)
#   - A GCP project with billing enabled
#
# Usage:
#   ./deploy.sh                  # Run all phases
#   ./deploy.sh --phase 4        # Run a specific phase
#   ./deploy.sh --from-phase 3   # Run from phase 3 onward
# =============================================================================

# --------------- Configuration ------------------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-us-central1}"
REPO="rams-agent"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

SQL_INSTANCE="rams-db"
SQL_DB="resources_db"
SQL_TIER="db-f1-micro"

BACKEND_SERVICE="rams-backend"
FRONTEND_SERVICE="rams-frontend"

FRONTEND_DOMAIN="rams.rambuilds.dev"
BACKEND_DOMAIN="api-rams.rambuilds.dev"

# Parse arguments
PHASE_ONLY=""
FROM_PHASE=1
while [[ $# -gt 0 ]]; do
  case $1 in
    --phase)   PHASE_ONLY="$2"; shift 2 ;;
    --from-phase) FROM_PHASE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

should_run() {
  local phase=$1
  if [[ -n "$PHASE_ONLY" ]]; then
    [[ "$phase" == "$PHASE_ONLY" ]]
  else
    [[ "$phase" -ge "$FROM_PHASE" ]]
  fi
}

echo "=== Rams Agent GCP Deploy ==="
echo "Project : $PROJECT_ID"
echo "Region  : $REGION"
echo "Registry: $REGISTRY"
echo ""

# --------------- Phase 1: Enable APIs & Artifact Registry --------------------
if should_run 1; then
  echo ">>> Phase 1: Enable APIs & create Artifact Registry"

  gcloud config set project "$PROJECT_ID"

  gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    cloudbuild.googleapis.com

  gcloud artifacts repositories describe "$REPO" \
    --location="$REGION" --format="value(name)" 2>/dev/null \
  || gcloud artifacts repositories create "$REPO" \
       --repository-format=docker --location="$REGION" \
       --description="Rams Agent container images"

  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

  echo "Phase 1 done."
fi

# --------------- Phase 2: Cloud SQL + pgvector --------------------------------
if should_run 2; then
  echo ">>> Phase 2: Create Cloud SQL instance"

  if gcloud sql instances describe "$SQL_INSTANCE" --format="value(name)" 2>/dev/null; then
    echo "  Instance $SQL_INSTANCE already exists, skipping creation."
  else
    echo "  Creating Cloud SQL instance (this takes ~5 minutes)..."
    gcloud sql instances create "$SQL_INSTANCE" \
      --database-version=POSTGRES_16 \
      --tier="$SQL_TIER" \
      --region="$REGION" \
      --storage-size=10GB \
      --storage-type=HDD \
      --no-assign-ip \
      --enable-google-private-path
  fi

  # Set postgres password
  read -rsp "Enter postgres password for Cloud SQL: " SQL_PASSWORD
  echo ""
  gcloud sql users set-password postgres \
    --instance="$SQL_INSTANCE" --password="$SQL_PASSWORD"

  # Create database if not exists
  gcloud sql databases describe "$SQL_DB" --instance="$SQL_INSTANCE" 2>/dev/null \
  || gcloud sql databases create "$SQL_DB" --instance="$SQL_INSTANCE"

  CLOUD_SQL_CONN=$(gcloud sql instances describe "$SQL_INSTANCE" \
    --format='value(connectionName)')
  echo "  Connection name: $CLOUD_SQL_CONN"

  echo ""
  echo "  IMPORTANT: Connect and enable pgvector extension:"
  echo "    gcloud sql connect $SQL_INSTANCE --user=postgres --database=$SQL_DB"
  echo "    Then run: CREATE EXTENSION IF NOT EXISTS vector;"
  echo ""
  echo "Phase 2 done."
fi

# --------------- Phase 3: Secrets --------------------------------------------
if should_run 3; then
  echo ">>> Phase 3: Create secrets in Secret Manager"

  CLOUD_SQL_CONN=$(gcloud sql instances describe "$SQL_INSTANCE" \
    --format='value(connectionName)')

  create_or_update_secret() {
    local name=$1
    local value=$2
    if gcloud secrets describe "$name" 2>/dev/null; then
      echo "$value" | gcloud secrets versions add "$name" --data-file=-
      echo "  Updated secret: $name"
    else
      echo "$value" | gcloud secrets create "$name" --data-file=-
      echo "  Created secret: $name"
    fi
  }

  # Prompt for secret values
  read -rsp "GEMINI_API_KEY: " GEMINI_KEY; echo ""
  read -rsp "API_KEY (for backend auth): " API_KEY; echo ""
  read -rp  "NEO4J_URI (or press Enter to skip): " NEO4J_URI; echo ""
  if [[ -n "$NEO4J_URI" ]]; then
    read -rsp "NEO4J_PASSWORD: " NEO4J_PW; echo ""
  fi

  # Database URL uses Cloud SQL Unix socket
  DB_URL="postgresql+asyncpg://postgres:${SQL_PASSWORD:-}@/${SQL_DB}?host=/cloudsql/${CLOUD_SQL_CONN}"

  create_or_update_secret "gemini-api-key" "$GEMINI_KEY"
  create_or_update_secret "api-key" "$API_KEY"
  create_or_update_secret "database-url" "$DB_URL"

  if [[ -n "${NEO4J_URI:-}" ]]; then
    create_or_update_secret "neo4j-uri" "$NEO4J_URI"
    create_or_update_secret "neo4j-password" "$NEO4J_PW"
  fi

  # Grant Cloud Run default SA access
  PROJECT_NUM=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
  SA_EMAIL="${PROJECT_NUM}-compute@developer.gserviceaccount.com"

  for SECRET in gemini-api-key api-key database-url; do
    gcloud secrets add-iam-policy-binding "$SECRET" \
      --member="serviceAccount:${SA_EMAIL}" \
      --role="roles/secretmanager.secretAccessor" --quiet
  done

  if [[ -n "${NEO4J_URI:-}" ]]; then
    for SECRET in neo4j-uri neo4j-password; do
      gcloud secrets add-iam-policy-binding "$SECRET" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/secretmanager.secretAccessor" --quiet
    done
  fi

  echo "Phase 3 done."
fi

# --------------- Phase 4: Build & deploy backend ----------------------------
if should_run 4; then
  echo ">>> Phase 4: Build & deploy backend"

  CLOUD_SQL_CONN=$(gcloud sql instances describe "$SQL_INSTANCE" \
    --format='value(connectionName)')
  TAG="${REGISTRY}/rams-backend:$(git rev-parse --short HEAD)"

  echo "  Building backend image via Cloud Build..."
  gcloud builds submit ./backend --tag "$TAG" --quiet

  # Build secrets flags
  SECRETS="DATABASE_URL=database-url:latest"
  SECRETS+=",GEMINI_API_KEY=gemini-api-key:latest"
  SECRETS+=",API_KEY=api-key:latest"

  ENV_VARS="NEO4J_USERNAME=neo4j,NEO4J_DATABASE=neo4j,DEBUG=false"
  ENV_VARS+=",ALLOWED_ORIGINS=[\"https://${FRONTEND_DOMAIN}\",\"chrome-extension://*\"]"

  # Add Neo4j secrets if they exist
  if gcloud secrets describe neo4j-uri 2>/dev/null; then
    SECRETS+=",NEO4J_URI=neo4j-uri:latest,NEO4J_PASSWORD=neo4j-password:latest"
  fi

  echo "  Deploying to Cloud Run..."
  gcloud run deploy "$BACKEND_SERVICE" \
    --image "$TAG" \
    --region "$REGION" \
    --port 8000 \
    --memory 512Mi --cpu 1 \
    --min-instances 0 --max-instances 3 \
    --allow-unauthenticated \
    --add-cloudsql-instances "$CLOUD_SQL_CONN" \
    --set-secrets "$SECRETS" \
    --set-env-vars "$ENV_VARS"

  BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --region "$REGION" --format='value(status.url)')
  echo "  Backend URL: $BACKEND_URL"
  echo "Phase 4 done."
fi

# --------------- Phase 5: Run Alembic migrations ----------------------------
if should_run 5; then
  echo ">>> Phase 5: Run database migrations"

  CLOUD_SQL_CONN=$(gcloud sql instances describe "$SQL_INSTANCE" \
    --format='value(connectionName)')
  TAG="${REGISTRY}/rams-backend:$(git rev-parse --short HEAD)"

  gcloud run jobs describe rams-migrate --region "$REGION" 2>/dev/null \
  && gcloud run jobs update rams-migrate \
       --image "$TAG" \
       --region "$REGION" \
       --add-cloudsql-instances "$CLOUD_SQL_CONN" \
       --set-secrets "DATABASE_URL=database-url:latest" \
  || gcloud run jobs create rams-migrate \
       --image "$TAG" \
       --region "$REGION" \
       --add-cloudsql-instances "$CLOUD_SQL_CONN" \
       --set-secrets "DATABASE_URL=database-url:latest" \
       --command "alembic" --args "upgrade,head"

  echo "  Executing migration job..."
  gcloud run jobs execute rams-migrate --region "$REGION" --wait

  echo "Phase 5 done."
fi

# --------------- Phase 6: Build & deploy frontend ----------------------------
if should_run 6; then
  echo ">>> Phase 6: Build & deploy frontend"

  TAG="${REGISTRY}/rams-frontend:$(git rev-parse --short HEAD)"

  # Read API key for build arg
  PROD_API_KEY=$(gcloud secrets versions access latest --secret=api-key)

  echo "  Building frontend image locally (for build args)..."
  docker build \
    --build-arg NEXT_PUBLIC_API_URL="https://${BACKEND_DOMAIN}" \
    --build-arg NEXT_PUBLIC_API_KEY="$PROD_API_KEY" \
    -t "$TAG" \
    ./frontend

  echo "  Pushing to Artifact Registry..."
  docker push "$TAG"

  echo "  Deploying to Cloud Run..."
  gcloud run deploy "$FRONTEND_SERVICE" \
    --image "$TAG" \
    --region "$REGION" \
    --port 3000 \
    --memory 256Mi --cpu 1 \
    --min-instances 0 --max-instances 2 \
    --allow-unauthenticated

  FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" \
    --region "$REGION" --format='value(status.url)')
  echo "  Frontend URL: $FRONTEND_URL"
  echo "Phase 6 done."
fi

# --------------- Phase 7: Custom domain mapping ------------------------------
if should_run 7; then
  echo ">>> Phase 7: Map custom domains"

  gcloud run domain-mappings describe \
    --domain "$FRONTEND_DOMAIN" --region "$REGION" 2>/dev/null \
  || gcloud run domain-mappings create \
       --service "$FRONTEND_SERVICE" \
       --domain "$FRONTEND_DOMAIN" \
       --region "$REGION"

  gcloud run domain-mappings describe \
    --domain "$BACKEND_DOMAIN" --region "$REGION" 2>/dev/null \
  || gcloud run domain-mappings create \
       --service "$BACKEND_SERVICE" \
       --domain "$BACKEND_DOMAIN" \
       --region "$REGION"

  echo "Phase 7 done."
fi

# --------------- Phase 8: DNS instructions -----------------------------------
if should_run 8; then
  echo ""
  echo "=============================================="
  echo "  DNS Records (add at Vercel/Netlify)"
  echo "=============================================="
  echo ""
  echo "  Type   | Name       | Value"
  echo "  -------|------------|-------------------------"
  echo "  CNAME  | rams       | ghs.googlehosted.com."
  echo "  CNAME  | api.rams   | ghs.googlehosted.com."
  echo ""
  echo "  TLS certificates will auto-provision in ~15-30 min"
  echo "  after DNS propagates."
  echo ""
  echo "=============================================="
  echo "  Verification"
  echo "=============================================="
  echo "  curl https://${BACKEND_DOMAIN}/health"
  echo "  open https://${FRONTEND_DOMAIN}"
  echo ""
fi

echo "=== Deploy complete ==="
