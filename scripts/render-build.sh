#!/usr/bin/env bash
set -e

# Disable corepack interactive prompts in CI/CD
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

echo "=== Ensuring modern Corepack (>=0.31.0) ==="
mkdir -p .corepack .bin
if [ ! -f ".corepack/node_modules/corepack/dist/corepack.js" ]; then
  npm install --prefix .corepack corepack@^0.34.0
fi

node .corepack/node_modules/corepack/dist/corepack.js enable --install-directory .bin
export PATH="$PWD/.bin:$PATH"

echo "=== Environment Info ==="
echo "Node version: $(node -v)"
echo "Corepack version: $(node .corepack/node_modules/corepack/dist/corepack.js --version)"
echo "pnpm version: $(pnpm -v)"
echo "========================"

# Install dependencies using frozen lockfile
pnpm install --frozen-lockfile

# Generate Prisma client
pnpm --filter @akfa/api exec prisma generate

# Build shared workspace packages and backend API in dependency order
pnpm --filter @akfa/shared build
pnpm --filter @akfa/api build

echo "=== Render build completed successfully ==="
