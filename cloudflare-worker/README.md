# Cloudflare Worker CORS Image Proxy

This Cloudflare Worker acts as a CORS proxy for images from external sources, allowing your web application to download images without CORS errors.

## Features

- ✅ Handles CORS headers automatically
- ✅ Validates allowed domains for security
- ✅ Caches images using Cloudflare's edge network
- ✅ Supports all common image formats
- ✅ Adds appropriate referer headers for each source
- ✅ TypeScript support

## Deployment Steps

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
# or
pnpm add -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create a new Worker

```bash
wrangler init cors-image-proxy
cd cors-image-proxy
```

### 4. Copy the Worker Code

Copy either `cors-proxy.js` or `cors-proxy.ts` to your worker directory as `src/index.js` or `src/index.ts`.

### 5. Configure wrangler.toml

Create or update `wrangler.toml`:

```toml
name = "cors-image-proxy"
main = "src/index.js" # or "src/index.ts" for TypeScript
compatibility_date = "2024-01-01"

[env.production]
route = "https://your-domain.com/cors-proxy/*"
```

### 6. Deploy

```bash
wrangler deploy
```

## Usage

Once deployed, you can use the proxy by passing the image URL as a query parameter:

```
https://your-worker.workers.dev/?url=https://cdn.harpi.in/image.jpg
```

## Integration with Your App

Update your `fetchImageWithRetry` function in `src/utils/browser.ts`:

```typescript
// Add your Cloudflare Worker URL
const CORS_PROXY_URL = 'https://your-worker.workers.dev'

export async function fetchImageWithRetry(url: string, attempt = 1): Promise<Blob> {
  try {
    // Use CORS proxy for external images
    const proxyUrl = `${CORS_PROXY_URL}?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.blob()
  } catch (error) {
    if (attempt < 3) {
      const delay = 1000 * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return fetchImageWithRetry(url, attempt + 1)
    }
    throw error
  }
}
```

## Security Considerations

1. **Domain Whitelist**: Only allowed domains can be proxied (configured in `ALLOWED_DOMAINS`)
2. **HTTPS Only**: Only HTTPS URLs are allowed
3. **Image Validation**: Content-Type is validated to ensure only images are proxied
4. **Rate Limiting**: Consider adding rate limiting in Cloudflare dashboard

## Adding New Domains

To add support for new image sources, update the `ALLOWED_DOMAINS` array in the worker code:

```javascript
const ALLOWED_DOMAINS = [
  'cdn.harpi.in',
  'thumb.k-hentai.org',
  'k-hentai.org',
  'api-kh.hiyobi.org',
  'ehgt.org',
  'new-domain.com', // Add new domain here
]
```

## Monitoring

Monitor your worker's performance and usage in the Cloudflare dashboard:

- Workers > Analytics
- Check for errors, requests, and bandwidth usage

## Cost Optimization

- Cloudflare Workers free tier includes 100,000 requests/day
- Enable caching to reduce origin requests
- Monitor bandwidth usage to stay within limits
