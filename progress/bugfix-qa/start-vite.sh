#!/usr/bin/env bash
set -euo pipefail
cd /home/claude/sites/Tracker-Sales-OS/frontend
set -a
source /tmp/tracker-sales-bugfix-qa/qa.env
set +a
exec pnpm exec vite --host 127.0.0.1 --port 3001 --strictPort
