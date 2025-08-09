import { CircuitBreaker, CircuitBreakerConfig } from './CircuitBreaker'
import { NotFoundError, UpstreamServerError } from './errors'
import { RetryConfig, retryWithBackoff } from './retry'

// Common proxy headers
export const PROXY_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Accept: 'application/json',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,sm;q=0.5',
  'Accept-Encoding': 'gzip, deflate',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
} as const

// Create a managed proxy client
export interface ProxyClientConfig {
  baseURL: string
  circuitBreaker?: CircuitBreakerConfig
  defaultHeaders?: Record<string, string>
  retry?: RetryConfig
}

export class ProxyClient {
  private readonly circuitBreaker?: CircuitBreaker

  constructor(private readonly config: ProxyClientConfig) {
    if (config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(config.baseURL, config.circuitBreaker)
    }
  }

  async fetch<T>(path: string, options: RequestInit = {}, raw = false): Promise<T> {
    const url = `${this.config.baseURL}${path}`

    const execute = async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...PROXY_HEADERS,
          ...this.config.defaultHeaders,
          ...options.headers,
        },
        redirect: options.redirect || 'manual',
        referrerPolicy: 'no-referrer',
      })

      if (response.status === 404) {
        throw new NotFoundError('404 Not Found', { url })
      }

      if (!response.ok) {
        const body = await response.json().catch(() => response.text().catch(() => '응답을 읽을 수 없습니다.'))
        throw new UpstreamServerError(`HTTP ${response.status}: ${response.statusText}`, response.status, {
          url,
          body,
        })
      }

      return raw ? ((await response.text()) as T) : ((await response.json()) as T)
    }

    const wrappedWithRetry = this.config.retry ? () => retryWithBackoff(execute, this.config.retry, { url }) : execute

    return this.circuitBreaker ? this.circuitBreaker.execute(wrappedWithRetry) : wrappedWithRetry()
  }
}
