#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  Mavis Panel - Standalone Bundle Compiler"
echo "==================================================="

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/scripts/bundle.js"

echo ""
echo "[SUCCESS] index.js bundle generated successfully!"
echo "Upload index.js + package.json to your server or container."
