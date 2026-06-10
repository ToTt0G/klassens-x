#!/bin/sh
set -e

# Detect if we are in a Dokploy preview deployment and swap env vars
if [ -n "$DOKPLOY_DEPLOY_URL" ]; then
  echo "🔧 Preview deployment detected via DOKPLOY_DEPLOY_URL ($DOKPLOY_DEPLOY_URL)"
  
  if [ -n "$CONVEX_URL_PREVIEW" ]; then
    export CONVEX_URL="$CONVEX_URL_PREVIEW"
  fi
  if [ -n "$CONVEX_SELF_HOSTED_URL_PREVIEW" ]; then
    export CONVEX_SELF_HOSTED_URL="$CONVEX_SELF_HOSTED_URL_PREVIEW"
  fi
  if [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY_PREVIEW" ]; then
    export CONVEX_SELF_HOSTED_ADMIN_KEY="$CONVEX_SELF_HOSTED_ADMIN_KEY_PREVIEW"
  fi
fi

if [ -n "$CONVEX_SELF_HOSTED_ADMIN_KEY" ] && [ -n "$CONVEX_SELF_HOSTED_URL" ]; then
  echo "🚀 Deploying Convex functions..."
  npx convex deploy
  echo "✅ Convex functions deployed successfully"
else
  echo "⚠️ CONVEX_SELF_HOSTED_ADMIN_KEY or CONVEX_SELF_HOSTED_URL not set. Skipping Convex deployment."
fi

echo "🌐 Starting Next.js..."
exec node server.js
