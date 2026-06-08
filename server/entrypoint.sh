#!/bin/sh
echo "=== Starting Movie API ==="
echo "Node version: $(node --version)"
echo "PORT=${PORT:-not set}"
echo "NODE_ENV=${NODE_ENV:-not set}"
echo "Working dir: $(pwd)"
echo "Files in /app:"
ls -la /app/dist/ 2>/dev/null || echo "dist/ not found"
ls -la /app/package.json 2>/dev/null || echo "package.json not found"
echo "==========================="
exec node dist/index.js
