#!/usr/bin/env bash
set -euo pipefail
cd /home/claude/sites/Tracker-Sales-OS/backend
set -a
source /tmp/tracker-sales-bugfix-qa/qa.env
set +a
pnpm exec tsc -p tsconfig.build.json --outDir /tmp/tracker-sales-bugfix-qa/backend-dist --incremental false
export NODE_PATH=/home/claude/sites/Tracker-Sales-OS/backend/node_modules
exec node /tmp/tracker-sales-bugfix-qa/backend-dist/main.js
