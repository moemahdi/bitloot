#!/bin/bash
# Post-generation script to fix generated SDK issues
# Fixes the FetchError constructor to use override modifier

FILE="src/generated/runtime.ts"

if [ ! -f "$FILE" ]; then
  echo "Error: $FILE not found"
  exit 1
fi

echo "Fixing $FILE..."

# Fix FetchError constructor - add override modifier to cause parameter
sed -i 's/constructor(public cause: Error, msg?: string)/constructor(public override cause: Error, msg?: string)/g' "$FILE"

echo "✅ Fixed FetchError constructor with override modifier"
