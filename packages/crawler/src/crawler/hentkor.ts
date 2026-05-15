import ms from 'ms'

import { ProxyClient, ProxyClientConfig } from './proxy'
import { isUpstreamServerError } from './proxy-utils'

const HENTKOR_CONFIG: ProxyClientConfig = {
  baseURL: 'https://hentkor.net',
  circuitBreaker: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: ms('10 minutes'),
    shouldCountAsFailure: isUpstreamServerError,
  },
  retry: {
    maxRetries: 2,
    initialDelay: ms('1 second'),
    maxDelay: ms('5 seconds'),
    backoffMultiplier: 2,
    jitter: true,
  },
  requestTimeout: ms('5 seconds'),
  defaultHeaders: {},
}

class HentKorClient {
  private readonly client: ProxyClient

  constructor() {
    this.client = new ProxyClient(HENTKOR_CONFIG)
  }

  fetchMangaImages(id: number, count: number): string[] {
    return Array.from({ length: count }, (_, i) => `https://cdn.hentkor.net/pages/${id}/${i + 1}.avif`)
  }
}

// Singleton instance
export const hentKorClient = new HentKorClient()
