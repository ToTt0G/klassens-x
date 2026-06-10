#!/bin/sh
set -e

if [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY" ] && [ -n "$CONVEX_SELF_HOSTED_URL" ]; then
  echo "🚀 Deploying Convex functions..."
  npx convex deploy
  echo "✅ Convex functions deployed successfully"
else
  echo "⚠️ CONVEX_SELF_HOSTED_ADMIN_KEY or CONVEX_SELF_HOSTED_URL not set. Skipping Convex deployment."
fi

echo "🌐 Starting Next.js..."
exec node server.js
