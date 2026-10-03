#!/usr/bin/env bash
# Start Blast Radius. One process, no --workers.
#   ./run.sh           uses Atlas from .env
#   ./run.sh --mock    in memory, no Atlas (seeds itself)
cd "$(dirname "$0")" || exit 1

PORT="${PORT:-8000}"
if [ -d .venv ]; then
  # shellcheck disable=SC1091
  . .venv/bin/activate
fi

if [ "$1" = "--mock" ]; then
  export USE_MOCK=1
  echo "Mock mode: in memory data, nothing is saved. Seeding first."
  # mock data lives inside one process, so seed and serve in the same one
  exec python - <<PY
import os, sys
sys.path.insert(0, os.getcwd())
import seed, uvicorn
ids = seed.seed(reset=True)
from app import logic
print("Seeded:", logic.blast_radius(ids["v2"])["line"])
uvicorn.run("app.main:app", host="127.0.0.1", port=int("$PORT"))
PY
fi

exec uvicorn app.main:app --host 127.0.0.1 --port "$PORT"
