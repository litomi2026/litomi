import { CircuitBreaker, type CircuitBreakerConfig } from '@/crawler/CircuitBreaker'
import { NotFoundError, UpstreamServerError } from '@/crawler/errors'

import { RetryConfig, retryWithBackoff } from './retry'

export const PROXY_HEADERS = {
  'accept-language': 'ko-KR,ko;q=0.9',
  connection: 'keep-alive',
  priority: 'u=0, i',
  'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
} as const

export interface ProxyClientConfig {
  baseURL: string
  circuitBreaker?: CircuitBreakerConfig
  defaultHeaders?: HeadersInit
  requestTimeout?: number
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
    const { data } = await this.fetchWithRedirect<T>(path, { ...options, redirect: options.redirect || 'manual' }, raw)
    return data
  }

  async fetchWithRedirect<T>(
    path: string,
    options: RequestInit = {},
    raw = false,
  ): Promise<{ data: T; finalUrl: string }> {
    const url = `${this.config.baseURL}${path}`

    const execute = async () => {
      let signal: AbortSignal | null | undefined

      if (this.config.requestTimeout) {
        const timeoutSignal = AbortSignal.timeout(this.config.requestTimeout)
        signal = options.signal ? abortSignalAny([options.signal, timeoutSignal]) : timeoutSignal
      } else {
        signal = options.signal
      }

      const response = await fetch(url, {
        ...options,
        signal,
        headers: {
          ...PROXY_HEADERS,
          ...this.config.defaultHeaders,
          ...options.headers,
        },
        redirect: options.redirect || 'follow',
      })

      if (response.status === 404) {
        throw new NotFoundError(undefined, { url })
      }

      if (!response.ok) {
        const body = await response.json().catch(() => response.text().catch(() => '응답을 읽을 수 없습니다.'))
        const retryAfter = response.headers.get('Retry-After')

        throw new UpstreamServerError(`HTTP ${response.status} ${response.statusText}`, response.status, {
          url,
          body,
          retryAfter,
        })
      }

      const data = raw ? ((await response.text()) as T) : ((await response.json()) as T)
      return { data, finalUrl: response.url }
    }

    const wrappedWithRetry = this.config.retry ? () => retryWithBackoff(execute, this.config.retry, { url }) : execute

    return this.circuitBreaker ? this.circuitBreaker.execute(wrappedWithRetry) : wrappedWithRetry()
  }
}

function abortSignalAny(signals: AbortSignal[]): AbortSignal {
  if ('any' in AbortSignal && typeof AbortSignal.any === 'function') {
    return AbortSignal.any(signals)
  }

  const controller = new AbortController()

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }

    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }

  return controller.signal
}
