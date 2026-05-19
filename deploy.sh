#!/usr/bin/env bash
# deploy.sh — build and publish Aqua Duel to sala.ch/aquafight
#
# Usage:
#   ./deploy.sh
#
# Requires:
#   - Node ≥ 18 / npm
#   - SSH access to sala.ch (key auth recommended)
#   - DEPLOY_HOST env var (default: sala.ch)
#   - DEPLOY_PATH env var (default: /var/www/sala.ch/aquafight)
#   - DEPLOY_USER env var (default: current Unix user)

set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-sala.ch}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/sala.ch/aquafight}"
DEPLOY_USER="${DEPLOY_USER:-$(whoami)}"
DEPLOY_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "▶ Installing dependencies…"
npm ci --prefer-offline

echo "▶ Running tests…"
npm test

echo "▶ Building for production…"
npm run build

echo "▶ Deploying to ${DEPLOY_TARGET}…"
# Ensure remote directory exists
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${DEPLOY_PATH}"

# Sync dist/ contents (trailing slash = contents, not dir itself)
rsync -avz --delete \
  --checksum \
  --exclude '.DS_Store' \
  dist/ \
  "${DEPLOY_TARGET}/"

echo "✅ Deployed → https://sala.ch/aquafight/"
