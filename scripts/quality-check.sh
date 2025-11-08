#!/bin/bash

# BitLoot Quality Check Wrapper
# Runs the Node.js quality check script with proper environment setup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# Run the Node.js script with all arguments
node "$SCRIPT_DIR/quality-check.js" "$@"
