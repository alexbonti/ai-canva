#!/usr/bin/env bash
#
# Deploy AI Canva to Firebase (Hosting + Cloud Functions + Firestore/Storage rules).
#
# This script encodes the deployment know-how for this repo so a deploy is one
# deterministic command for humans, CI, and AI agents. It handles the gotchas:
#   - builds the client from the client/ dir (Vite needs cwd = client/ for index.html)
#   - cleans functions/dist so stale provider files (e.g. an old claude.js) never ship
#   - copies OLLAMA_API_KEY from server/.env into functions/.env (never echoes it)
#   - deploys the project, then you can verify via the URLs printed at the end
#
# Prereqs:
#   - firebase CLI installed and logged in (firebase login)
#   - server/.env populated with OLLAMA_API_KEY (+ FAL_KEY / STITCH_API_KEY as needed)
#   - functions/.env with your keys (this script ensures OLLAMA_API_KEY is present)
#
# Usage:
#   bash scripts/deploy.sh                 # deploy to default project (carbondocs)
#   FIREBASE_PROJECT=my-proj bash scripts/deploy.sh

set -euo pipefail

# Target project. Defaults to the value in .firebaserc (carbondocs).
PROJECT="${FIREBASE_PROJECT:-carbondocs}"

# Resolve the repo root regardless of where the script is invoked from.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Deploy target project: $PROJECT"
firebase use "$PROJECT"

echo "==> Checking server/.env has OLLAMA_API_KEY"
if [ ! -f server/.env ]; then
  echo "ERROR: server/.env not found. Copy server/.env.example to server/.env and add keys." >&2
  exit 1
fi
if ! grep -q '^OLLAMA_API_KEY=' server/.env; then
  echo "ERROR: server/.env has no OLLAMA_API_KEY. Set it first." >&2
  exit 1
fi

echo "==> Ensuring provider keys are present in functions/.env"
# Functions read their own env at runtime; only OLLAMA_API_KEY used to be copied,
# so FAL_KEY / STITCH_API_KEY / HERENOW_API_KEY / GITHUB_TOKEN had to be maintained
# in two files by hand (a silent feature loss if one was forgotten).
touch functions/.env
for key in OLLAMA_API_KEY FAL_KEY STITCH_API_KEY HERENOW_API_KEY GITHUB_TOKEN; do
  if grep -q "^${key}=" server/.env && ! grep -q "^${key}=" functions/.env; then
    grep "^${key}=" server/.env | head -1 >> functions/.env
    echo "   copied ${key} into functions/.env (value not echoed)"
  fi
done

echo "==> Building client (from client/)"
( cd client && npm run build )

echo "==> Building functions (cleaning dist to drop stale provider files)"
rm -rf functions/dist
( cd functions && npm run build )

echo "==> Deploying to $PROJECT (hosting + functions + firestore/storage rules)"
firebase deploy --project "$PROJECT"

echo
echo "==> Deploy complete."
echo "   Hosting URL:  https://$PROJECT.web.app"
echo "   Verify with:"
echo "     curl -s https://$PROJECT.web.app/"
echo "     curl -s https://$PROJECT.web.app/api/health"
echo "     curl -s -X POST https://$PROJECT.web.app/api/generate -H 'Content-Type: application/json' -d '{\"userPrompt\":\"Say hi\"}'"
