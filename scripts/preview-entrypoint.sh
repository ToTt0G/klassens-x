#!/bin/sh
set -e

echo "🚀 Deploying Convex functions to preview backend..."
npx convex deploy
echo "✅ Convex functions deployed"

echo "🌐 Starting Next.js..."
exec node server.js
