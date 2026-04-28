import { requestBackend } from '@test/backend/setup/app'
import { externalRoute, installExternalFetchGuard } from '@test/backend/setup/network'
import { afterEach, describe, expect, test } from 'bun:test'

import backendApp from '@/backend'

const ORIGINAL_NODE_ENV = process.env.NODE_ENV
const REQUEST_IP_PORT = 3002
const REQUEST_IP_ADDRESS = '127.0.0.1'
const SOURCE_URL = 'https://cdn.imagedeliveries.com/123/thumbnails/cover.webp'
const PROXY_PATH = `/i/v2/manga/123/thumbnail/1.webp?u=${encodeURIComponent(SOURCE_URL)}`
const K_HENTAI_SOURCE_URL =
  'https://storage-6-10.k-hentai.org/storage/d6/1b/d61b5b1d7e44c074fe7b5f20ffc8d3799c938dfb.webp?md5=2upfzSa8Q67iO8PfKDC0dw&expires=1777507199'
const K_HENTAI_PROXY_PATH = `/i/v2/manga/3910121/original/13.webp?u=${encodeURIComponent(K_HENTAI_SOURCE_URL)}`
const IMAGE_EGRESS_PROXY_URL = 'http://litomi-image-egress-proxy:8080'
const IMAGE_PROXY_UPSTREAM_ENV_KEYS = [
  'IMAGE_PROXY_UPSTREAM_PROXY_HOST_SUFFIXES',
  'IMAGE_PROXY_UPSTREAM_PROXY_URL',
] as const
const ORIGINAL_IMAGE_PROXY_UPSTREAM_ENV = Object.fromEntries(
  IMAGE_PROXY_UPSTREAM_ENV_KEYS.map((key) => [key, process.env[key]]),
)

let externalFetchGuard: ReturnType<typeof installImageFetchGuard> | undefined

afterEach(() => {
  externalFetchGuard?.restore()
  externalFetchGuard = undefined
  setNodeEnv(ORIGINAL_NODE_ENV)
  restoreImageProxyUpstreamEnv()
})

describe('GET /i/v2/manga/:mangaId/:variant/:page', () => {
  test('비프로덕션에서는 localhost 요청을 허용한다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('test')

    const response = await requestBackend({
      path: PROXY_PATH,
      headers: {
        Origin: 'http://localhost:3000',
        'Sec-Fetch-Site': 'same-site',
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800',
    )
    expect(externalFetchGuard.calls).toHaveLength(1)
  })

  test('프로덕션에서는 litomi.in Origin 요청을 허용한다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackend({
      path: PROXY_PATH,
      headers: {
        Origin: 'https://litomi.in',
        'Sec-Fetch-Site': 'same-origin',
      },
    })

    expect(response.status).toBe(200)
    expect(externalFetchGuard.calls).toHaveLength(1)
  })

  test('프로덕션에서는 stg.litomi.in Referer 요청을 허용한다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackendWithoutDefaultHeaders(PROXY_PATH, {
      headers: {
        Referer: 'https://stg.litomi.in/manga/123',
        'Sec-Fetch-Site': 'same-origin',
      },
    })

    expect(response.status).toBe(200)
    expect(externalFetchGuard.calls).toHaveLength(1)
  })

  test('허용되지 않은 Origin 요청은 401을 반환하고 업스트림을 호출하지 않는다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackend({
      path: PROXY_PATH,
      headers: {
        Origin: 'https://example.com',
        Referer: 'https://litomi.in/manga/123',
        'Sec-Fetch-Site': 'same-site',
      },
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toBe('401 Unauthorized')
    expect(externalFetchGuard.calls).toHaveLength(0)
  })

  test('Fetch Metadata가 cross-site인 요청은 401을 반환하고 업스트림을 호출하지 않는다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackend({
      path: PROXY_PATH,
      headers: {
        Origin: 'https://litomi.in',
        'Sec-Fetch-Site': 'cross-site',
      },
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toBe('401 Unauthorized')
    expect(externalFetchGuard.calls).toHaveLength(0)
  })

  test('k-hentai 계열 업스트림에는 이미지 egress proxy를 사용한다', async () => {
    process.env.IMAGE_PROXY_UPSTREAM_PROXY_URL = IMAGE_EGRESS_PROXY_URL
    externalFetchGuard = installImageFetchGuard(K_HENTAI_SOURCE_URL)
    setNodeEnv('production')

    const response = await requestBackend({
      path: K_HENTAI_PROXY_PATH,
      headers: {
        Origin: 'https://litomi.in',
        'Sec-Fetch-Site': 'same-origin',
      },
    })

    expect(response.status).toBe(200)
    expect((externalFetchGuard.calls[0].init as RequestInit & { proxy?: string }).proxy).toBe(IMAGE_EGRESS_PROXY_URL)
  })

  test('proxy 미대상 업스트림은 직접 fetch한다', async () => {
    process.env.IMAGE_PROXY_UPSTREAM_PROXY_URL = IMAGE_EGRESS_PROXY_URL
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackend({
      path: PROXY_PATH,
      headers: {
        Origin: 'https://litomi.in',
        'Sec-Fetch-Site': 'same-origin',
      },
    })

    expect(response.status).toBe(200)
    expect((externalFetchGuard.calls[0].init as RequestInit & { proxy?: string }).proxy).toBeUndefined()
  })
})

function installImageFetchGuard(sourceURL: string = SOURCE_URL) {
  return installExternalFetchGuard([
    externalRoute({
      matcher: sourceURL,
      response: new Response('image', {
        headers: {
          'Content-Length': '5',
          'Content-Type': 'image/webp',
        },
      }),
    }),
  ])
}

async function requestBackendWithoutDefaultHeaders(path: string, init: RequestInit = {}) {
  return await backendApp.request(path, init, {
    requestIP() {
      return {
        address: REQUEST_IP_ADDRESS,
        family: 'IPv4',
        port: REQUEST_IP_PORT,
      }
    },
  })
}

function restoreImageProxyUpstreamEnv() {
  IMAGE_PROXY_UPSTREAM_ENV_KEYS.forEach((key) => {
    const value = ORIGINAL_IMAGE_PROXY_UPSTREAM_ENV[key]
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key)
      return
    }

    process.env[key] = value
  })
}

function setNodeEnv(value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    return
  }

  Object.assign(process.env, { NODE_ENV: value })
}
