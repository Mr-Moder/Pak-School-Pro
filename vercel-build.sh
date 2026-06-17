#!/bin/bash
set -e

# Always build from the git repo root regardless of Vercel's rootDirectory setting
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

export BASE_PATH=/
export PORT=3000
export NODE_ENV=production

pnpm --filter @workspace/school-dashboard run build

mkdir -p dist
cp -r artifacts/school-dashboard/dist/public/. dist/
