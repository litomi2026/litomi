import { Curl } from 'node-libcurl'
import { Agent } from 'undici'

export class EnhancedProxyClient {
  private tlsClient: TLSClient

  constructor() {
    this.tlsClient = new TLSClient()
  }

  async fetchWithTLS(url: string, headers: Record<string, string> = {}): Promise<string> {
    // First attempt with TLS fingerprinting
    try {
      return await this.tlsClient.fetchWithChromeFingerprint(url, headers)
    } catch (error) {
      console.error('TLS client failed:', error)
      throw error
    }
  }
}

export class TLSClient {
  async fetchWithChromeFingerprint(url: string, headers: Record<string, string> = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const curl = new Curl()

      try {
        // Basic URL and follow redirects
        curl.setOpt('URL', url)
        curl.setOpt('FOLLOWLOCATION', true)
        curl.setOpt('MAXREDIRS', 10)

        // HTTP/2 support (Chrome uses HTTP/2)
        curl.setOpt('HTTP_VERSION', 2) // HTTP/2

        // TLS settings to match Chrome
        curl.setOpt('SSLVERSION', 6) // TLSv1.2

        // Cipher suite order matching Chrome 120
        curl.setOpt(
          'SSL_CIPHER_LIST',
          [
            'TLS_AES_128_GCM_SHA256',
            'TLS_AES_256_GCM_SHA384',
            'TLS_CHACHA20_POLY1305_SHA256',
            'ECDHE-ECDSA-AES128-GCM-SHA256',
            'ECDHE-RSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES256-GCM-SHA384',
            'ECDHE-ECDSA-CHACHA20-POLY1305',
            'ECDHE-RSA-CHACHA20-POLY1305',
            'ECDHE-RSA-AES128-SHA',
            'ECDHE-RSA-AES256-SHA',
            'AES128-GCM-SHA256',
            'AES256-GCM-SHA384',
            'AES128-SHA',
            'AES256-SHA',
          ].join(':'),
        )

        // Set headers in Chrome order
        const chromeHeaders = [
          'sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile: ?0',
          'sec-ch-ua-platform: "Windows"',
          'upgrade-insecure-requests: 1',
          'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'sec-fetch-site: none',
          'sec-fetch-mode: navigate',
          'sec-fetch-user: ?1',
          'sec-fetch-dest: document',
          'accept-encoding: gzip, deflate, br',
          'accept-language: en-US,en;q=0.9',
          ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`),
        ]

        curl.setOpt('HTTPHEADER', chromeHeaders)

        // Enable compression
        curl.setOpt('ACCEPT_ENCODING', 'gzip, deflate, br')

        // Timeout
        curl.setOpt('TIMEOUT', 30)

        // Enable cookies
        curl.setOpt('COOKIEFILE', '') // Enable cookie engine
        curl.setOpt('COOKIEJAR', '/tmp/cookies.txt')

        // Disable SSL verification for testing (remove in production)
        if (process.env.NODE_ENV === 'development') {
          curl.setOpt('SSL_VERIFYPEER', false)
          curl.setOpt('SSL_VERIFYHOST', false)
        }

        // Set up response handling
        let responseData = ''
        curl.setOpt('WRITEFUNCTION', (chunk: Buffer) => {
          responseData += chunk.toString()
          return chunk.length
        })

        curl.on('end', (statusCode: number) => {
          curl.close()
          if (statusCode === 200) {
            resolve(responseData)
          } else {
            reject(new Error(`HTTP ${statusCode}`))
          }
        })

        curl.on('error', (error: Error) => {
          curl.close()
          reject(error)
        })

        curl.perform()
      } catch (error) {
        curl.close()
        reject(error)
      }
    })
  }
}

export function createChromeAgent() {
  return new Agent({
    pipelining: 0,
    connect: {
      // TLS options
      ALPNProtocols: ['h2', 'http/1.1'],
      // Cipher suites (limited compared to curl)
      ciphers: ['TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256'].join(':'),
      // Signature algorithms
      sigalgs: [
        'ecdsa_secp256r1_sha256',
        'rsa_pss_rsae_sha256',
        'rsa_pkcs1_sha256',
        'ecdsa_secp384r1_sha384',
        'rsa_pss_rsae_sha384',
        'rsa_pkcs1_sha384',
        'rsa_pss_rsae_sha512',
        'rsa_pkcs1_sha512',
      ].join(':'),
      // Supported groups (elliptic curves)
      ecdhCurve: 'X25519:P-256:P-384',
    },
  })
}

// Integration with HentaiPaw
export async function fetchHentaiPawWithTLS(path: string): Promise<string> {
  const client = new EnhancedProxyClient()
  const url = `https://hentaipaw.com${path}`

  const headers = {
    Referer: 'https://hentaipaw.com/',
    Origin: 'https://hentaipaw.com',
  }

  // Add random delay
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000))

  const html = await client.fetchWithTLS(url, headers)

  // Check if blocked
  if (html.includes('Cloudflare') && html.includes('blocked')) {
    throw new Error('Still blocked by Cloudflare')
  }

  return html
}
