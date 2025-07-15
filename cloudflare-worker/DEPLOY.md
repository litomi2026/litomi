# Deploy TypeScript CORS Proxy to image.gwak2837.workers.dev

Since you already have the worker created at `image.gwak2837.workers.dev`, follow these steps:

## 1. Set up the project structure

Create a new directory for your worker project:

```bash
mkdir cloudflare-image-worker
cd cloudflare-image-worker
```

## 2. Copy the necessary files

Copy these files from the `cloudflare-worker` directory:

- `package.json`
- `tsconfig.json`
- `wrangler.toml`

## 3. Create src directory and copy the TypeScript file

```bash
mkdir src
# Copy cors-proxy.ts to src/index.ts
cp /path/to/litomi/cloudflare-worker/cors-proxy.ts src/index.ts
```

## 4. Install dependencies

```bash
npm install
# or
pnpm install
```

## 5. Login to Cloudflare (if not already logged in)

```bash
npx wrangler login
```

## 6. Deploy to your existing worker

```bash
npm run deploy
# or
npx wrangler deploy
```

This will deploy to `image.gwak2837.workers.dev`.

## 7. Update your environment variables

In your main application, update the environment variable:

```env
NEXT_PUBLIC_CORS_PROXY_URL=https://image.gwak2837.workers.dev
```

## Testing

Test the deployment by visiting:

```
https://image.gwak2837.workers.dev/?url=https://cdn.harpi.in/test-image.jpg
```

You should see CORS headers in the response.

## Development

To run locally for testing:

```bash
npm run dev
# or
npx wrangler dev
```

This will start a local server at http://localhost:8787

## Troubleshooting

If you get TypeScript errors:

1. Make sure the `Env` interface has at least one property (you already added `a: string`)
2. The eslint-disable comments are already in place

If deployment fails:

1. Check that you're logged in: `npx wrangler whoami`
2. Verify the worker name in wrangler.toml matches your worker: `name = "image"`
3. Make sure you're in the correct directory with wrangler.toml
