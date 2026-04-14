#!/usr/bin/env bash
set -euo pipefail

# Dev start script for vizard-saas
# - starts a temporary Redis (docker or local redis-server) if needed
# - ensures backend venv and installs requirements
# - starts backend (uvicorn) and celery worker (background)
# - starts frontend (npm dev) in background

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$LOG_DIR"
cd "$BACKEND_DIR"

echo "[dev_start] Root: $ROOT_DIR"

# Start Redis: prefer docker, else try local redis-server, else brew
start_redis() {
  if command -v docker >/dev/null 2>&1; then
    if docker ps -a --format '{{.Names}}' | grep -q '^vizard-redis$'; then
      echo "[dev_start] Starting existing docker redis container..."
      docker start vizard-redis >/dev/null || true
    else
      echo "[dev_start] Running redis in docker (no persistence)..."
      docker run -d --name vizard-redis -p 6379:6379 redis:7 >/dev/null
    fi
    return 0
  fi

  if command -v redis-server >/dev/null 2>&1; then
    echo "[dev_start] Starting local redis-server (dev mode, no persistence)..."
    # run without persistence (development only)
    nohup redis-server --save "" --appendonly no --port 6379 > "$LOG_DIR/redis.log" 2>&1 &
    sleep 1
    return 0
  fi

  if command -v brew >/dev/null 2>&1; then
    echo "[dev_start] Trying to start Homebrew redis service..."
    brew services start redis || true
    return 0
  fi

  echo "[dev_start] WARNING: No docker or redis-server found. Please install Redis or Docker."
  return 1
}

# Create and activate venv, install requirements
ensure_venv_and_deps() {
  if [ ! -d ".venv" ]; then
    echo "[dev_start] Creating Python venv..."
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  echo "[dev_start] Upgrading pip and installing backend requirements..."
  pip install --upgrade pip
  if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    pip install -r "$BACKEND_DIR/requirements.txt"
  else
    pip install fastapi "uvicorn[standard]" sqlalchemy asyncpg psycopg2-binary "passlib[bcrypt]" "python-jose[cryptography]" python-multipart razorpay openai celery redis python-dotenv pydantic-settings alembic yt-dlp groq google-auth email-validator
  fi
}

start_backend() {
  # Activate venv and start uvicorn
  # Use 127.0.0.1 to avoid binding issues
  echo "[dev_start] Starting backend uvicorn (logs -> $LOG_DIR/uvicorn.log)"
  source .venv/bin/activate
  nohup .venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000 > "$LOG_DIR/uvicorn.log" 2>&1 &
  sleep 1
}

start_celery() {
  echo "[dev_start] Starting celery worker (logs -> $LOG_DIR/celery.log)"
  source .venv/bin/activate
  nohup .venv/bin/python -m celery -A worker.celery_app worker --loglevel=info > "$LOG_DIR/celery.log" 2>&1 &
  sleep 1
}

start_frontend() {
  echo "[dev_start] Installing frontend deps (if needed) and starting Next.js dev server (logs -> $LOG_DIR/frontend.log)"
  if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    if [ ! -d "node_modules" ]; then
      npm install
    fi
    # Start Next.js in background
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    cd "$BACKEND_DIR"
    sleep 1
  else
    echo "[dev_start] Frontend folder not found, skipping frontend start"
  fi
}

# Run steps
echo "[dev_start] Starting Redis..."
start_redis || echo "[dev_start] Redis may not be running; Celery will fail until Redis is available."

echo "[dev_start] Ensuring venv and backend deps..."
ensure_venv_and_deps

echo "[dev_start] Starting backend and worker..."
start_backend
start_celery

echo "[dev_start] Starting frontend (optional)..."
start_frontend

# Print status and logs tail
echo "\n[dev_start] Done. Service status:"
ps aux | egrep 'uvicorn|celery|redis-server|docker' | grep -v egrep || true

echo "\n[dev_start] Tail of logs (uvicorn/celery/frontend):\n"
[ -f "$LOG_DIR/uvicorn.log" ] && sed -n '1,120p' "$LOG_DIR/uvicorn.log" || echo "uvicorn.log missing"
[ -f "$LOG_DIR/celery.log" ] && sed -n '1,120p' "$LOG_DIR/celery.log" || echo "celery.log missing"
[ -f "$LOG_DIR/frontend.log" ] && sed -n '1,120p' "$LOG_DIR/frontend.log" || echo "frontend.log missing"

echo "\n[dev_start] Access the frontend at http://localhost:3000 and the API at http://127.0.0.1:8000"

exit 0
