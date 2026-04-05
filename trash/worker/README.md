# Cloudflare worker

## Deploy TypeScript CORS Proxy

### 1. Set up the project structure

Create a new directory for your worker project:

```bash
cd cloudflare-worker
```

### 2. Install dependencies (if not already installed)

```bash
bun i
```

### 3. Login to Cloudflare (if not already logged in)

```bash
bunx wrangler login
```

### 4. Deploy to your existing worker

```bash
bun run deploy
```

### 5. Update your environment variables

In your main application, update the environment variable:

## Testing

Test the deployment by visiting:

You should see CORS headers in the response.

## Development

To run locally for testing:

```bash
bun dev
```

This will start a local server at http://localhost:8787

## Troubleshooting

If you get TypeScript errors:

1. Make sure the `Env` interface has at least one property (you already added `a: string`)
2. The eslint-disable comments are already in place

If deployment fails:

1. Check that you're logged in: `bunx wrangler whoami`
2. Verify the worker name in wrangler.toml matches your worker: `name = "image"`
3. Make sure you're in the correct directory with wrangler.toml
