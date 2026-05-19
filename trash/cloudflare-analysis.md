# Cloudflare Bot Detection Analysis

## Detection Layers

### 1. TLS Fingerprinting (JA3/JA3S)

- **What**: Unique fingerprint based on TLS handshake parameters
- **Includes**: TLS version, cipher suites, extensions, elliptic curves
- **Problem**: Node.js fetch/axios have different fingerprints than browsers

### 2. HTTP/2 Fingerprinting (AKAMAI)

- Window size (SETTINGS_INITIAL_WINDOW_SIZE)
- Stream priorities
- Header order
- Pseudo-header order

### 3. JavaScript Challenges

- Executes JavaScript to verify browser environment
- Checks for:
  - `navigator.webdriver`
  - `window.chrome`
  - Canvas fingerprinting
  - WebGL capabilities
  - Plugin detection

### 4. Behavioral Analysis

- Mouse movements
- Keyboard events
- Time between requests
- Request patterns

### 5. IP Reputation

- Datacenter IPs are flagged
- Residential proxies have better success
- Rate limiting per IP

## TLS Fingerprinting Deep Dive

### Browser TLS Fingerprint Example (Chrome 120)

```
JA3: 771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0
```

### Node.js Default Fingerprint

```
JA3: 771,4865-4866-4867-49195-49199-52393-52392-49196-49200-49171-49172-156-157-47-53,0-23-65281-10-11-16-5-13-18-51-45-43-27-21,29-23-24-25,0
```

Key differences:

- Extension order
- Supported groups
- Signature algorithms

## Implementation Solutions

### 1. curl-impersonate

```bash
npm install node-libcurl
```

```typescript
import { Curl } from 'node-libcurl'

function fetchWithCurlImpersonate(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const curl = new Curl()

    // Impersonate Chrome 120
    curl.setOpt('URL', url)
    curl.setOpt('FOLLOWLOCATION', true)
    curl.setOpt('HTTP_VERSION', 2) // HTTP/2
    curl.setOpt('SSL_CIPHER_LIST', 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256')

    // Chrome headers
    curl.setOpt('HTTPHEADER', [
      'sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile: ?0',
      'sec-ch-ua-platform: "Windows"',
      'upgrade-insecure-requests: 1',
      'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-fetch-site: none',
      'sec-fetch-mode: navigate',
      'sec-fetch-user: ?1',
      'sec-fetch-dest: document',
      'accept-encoding: gzip, deflate, br',
      'accept-language: en-US,en;q=0.9',
    ])

    curl.on('end', (statusCode, body) => {
      curl.close()
      resolve(body)
    })

    curl.on('error', (error) => {
      curl.close()
      reject(error)
    })

    curl.perform()
  })
}
```

### 2. tls-client (Go-based solution)

```bash
npm install tlsclient
```

```typescript
import { TLSClient } from 'tlsclient'

async function fetchWithTLSClient(url: string) {
  const client = new TLSClient({
    // Mimic Chrome 120
    clientIdentifier: 'chrome_120',

    // Optional: Use rotating proxies
    proxy: process.env.PROXY_URL,

    // Custom headers
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    },

    // Follow redirects
    followRedirects: true,

    // Timeout
    timeout: 30000,
  })

  const response = await client.get(url)
  return response.body
}
```

### 3. Puppeteer with Stealth Plugin

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

```typescript
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

puppeteer.use(StealthPlugin())

async function fetchWithPuppeteer(url: string) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  })

  const page = await browser.newPage()

  // Additional evasions
  await page.evaluateOnNewDocument(() => {
    // Override webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    })

    // Override chrome property
    window.chrome = {
      runtime: {},
    }

    // Override permissions
    const originalQuery = window.navigator.permissions.query
    window.navigator.permissions.query = (parameters) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
  })

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 })

  // Navigate with realistic timing
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  })

  // Wait for content
  await page.waitForTimeout(2000)

  const html = await page.content()
  await browser.close()

  return html
}
```

### 4. Got with HTTP2 Wrapper

```bash
npm install got http2-wrapper
```

```typescript
import got from 'got'
import http2 from 'http2-wrapper'

const client = got.extend({
  http2: true,
  agent: {
    http2: new http2.Agent(),
  },
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'cache-control': 'no-cache',
    pragma: 'no-cache',
  },
  // Custom TLS options
  https: {
    alpnProtocols: ['h2', 'http/1.1'],
    ciphers: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
    ].join(':'),
  },
})

async function fetchWithGot(url: string) {
  const response = await client(url)
  return response.body
}
```

## Detection Test Script

```typescript
async function testCloudflareBypass(url: string) {
  const tests = [
    { name: 'Node fetch', fn: () => fetch(url).then((r) => r.text()) },
    { name: 'curl-impersonate', fn: () => fetchWithCurlImpersonate(url) },
    { name: 'tls-client', fn: () => fetchWithTLSClient(url) },
    { name: 'puppeteer', fn: () => fetchWithPuppeteer(url) },
  ]

  for (const test of tests) {
    try {
      console.log(`\nTesting ${test.name}...`)
      const html = await test.fn()

      const blocked = html.includes('Cloudflare') && html.includes('blocked')
      console.log(`Result: ${blocked ? '❌ Blocked' : '✅ Success'}`)

      if (!blocked) {
        console.log('Content preview:', html.slice(0, 200))
      }
    } catch (error) {
      console.log(`Error: ${error.message}`)
    }
  }
}
```

## Recommendations

1. **For simple Cloudflare (no JS challenge)**: Use curl-impersonate or tls-client
2. **For JS challenges**: Use Puppeteer with stealth plugin
3. **For production**: Consider rotating residential proxies + headless browser
4. **For scale**: Use professional scraping services (ScraperAPI, Bright Data)

## Additional Evasion Techniques

1. **Request Timing**
   - Random delays between requests (2-10 seconds)
   - Realistic browsing patterns
   - Don't request too many pages too quickly

2. **Session Management**
   - Maintain cookies across requests
   - Use the same "session" for related requests
   - Store and reuse cf_clearance cookies

3. **IP Rotation**
   - Use residential proxies
   - Rotate IPs every 10-20 requests
   - Avoid datacenter IPs

4. **Header Consistency**
   - Keep headers consistent within a session
   - Match header order to real browsers
   - Include all standard browser headers
