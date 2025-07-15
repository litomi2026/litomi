#!/bin/bash

# Quick deployment script for image.gwak2837.workers.dev

echo "🚀 Setting up Cloudflare Worker deployment..."

# Create deployment directory
mkdir -p ../cloudflare-image-worker/src
cd ../cloudflare-image-worker

# Copy necessary files
echo "📁 Copying files..."
cp ../litomi/cloudflare-worker/package.json .
cp ../litomi/cloudflare-worker/tsconfig.json .
cp ../litomi/cloudflare-worker/wrangler.toml .
cp ../litomi/cloudflare-worker/cors-proxy.ts src/index.ts

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Deploy
echo "🌐 Deploying to image.gwak2837.workers.dev..."
bun run deploy

echo "✅ Deployment complete!"
echo "🔗 Your CORS proxy is available at: https://image.gwak2837.workers.dev"
echo ""
echo "📝 Add this to your .env file:"
echo "NEXT_PUBLIC_CORS_PROXY_URL=https://image.gwak2837.workers.dev"