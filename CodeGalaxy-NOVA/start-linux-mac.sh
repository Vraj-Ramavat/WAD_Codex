#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -f backend/src/server.ts ]; then echo 'Run npm run setup first'; exit 1; fi
trap 'kill 0' EXIT
(cd backend && npm run dev) &
(cd frontend && npm run dev) &
wait
