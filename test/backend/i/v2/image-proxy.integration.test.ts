import { requestBackend } from '@test/backend/setup/app'
import { externalRoute, installExternalFetchGuard } from '@test/backend/setup/network'
import { afterEach, describe, expect, test } from 'bun:test'

import backendApp from '@/app'

const ORIGINAL_NODE_ENV = process.env.NODE_ENV
const REQUEST_IP_PORT = 3002
const REQUEST_IP_ADDRESS = '127.0.0.1'
const SOURCE_URL = 'https://cdn.imagedeliveries.com/123/thumbnails/cover.webp'
const PROXY_PATH = `/i/v2/manga/123/thumbnail/1.webp?u=${encodeURIComponent(SOURCE_URL)}`

let externalFetchGuard: ReturnType<typeof installImageFetchGuard> | undefined

afterEach(() => {
  externalFetchGuard?.restore()
  externalFetchGuard = undefined
  setNodeEnv(ORIGINAL_NODE_ENV)
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

  test('프로덕션에서는 litomi.cc Origin 요청을 허용한다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackend({
      path: PROXY_PATH,
      headers: {
        Origin: 'https://litomi.cc',
        'Sec-Fetch-Site': 'same-origin',
      },
    })

    expect(response.status).toBe(200)
    expect(externalFetchGuard.calls).toHaveLength(1)
  })

  test('프로덕션에서는 stg.litomi.cc Referer 요청을 허용한다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackendWithoutDefaultHeaders(PROXY_PATH, {
      headers: {
        Referer: 'https://stg.litomi.cc/manga/123',
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
        Referer: 'https://litomi.cc/manga/123',
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
        Origin: 'https://litomi.cc',
        'Sec-Fetch-Site': 'cross-site',
      },
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.text()).toBe('401 Unauthorized')
    expect(externalFetchGuard.calls).toHaveLength(0)
  })

  test('업스트림 이미지는 직접 fetch한다', async () => {
    externalFetchGuard = installImageFetchGuard()
    setNodeEnv('production')

    const response = await requestBackend({
      path: PROXY_PATH,
      headers: {
        Origin: 'https://litomi.cc',
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

function setNodeEnv(value: string | undefined) {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, 'NODE_ENV')
    return
  }

  Object.assign(process.env, { NODE_ENV: value })
}
