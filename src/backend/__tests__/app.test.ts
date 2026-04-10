import { beforeAll, describe, expect, test } from 'bun:test'

let appRoutes: typeof import('../app').default

beforeAll(async () => {
  appRoutes = (await import('../app')).default
})

describe('GET /', () => {
  test('쿼리 파라미터 없이 루트로 요청하면 404를 반환한다', async () => {
    const response = await appRoutes.request('/')
    expect(response.status).toBe(404)
  })

  test('쿼리 파라미터를 포함해도 루트로 요청하면 404를 반환한다', async () => {
    const response = await appRoutes.request('/?name=홍길동&age=25')
    expect(response.status).toBe(404)
  })

  test('동일한 루트 요청을 여러 번 보내도 일관되게 404를 반환한다', async () => {
    const promises = Array.from({ length: 5 }, () => appRoutes.request('/?name=테스트&age=20'))
    const responses = await Promise.all(promises)

    expect(responses.every((r) => r.status === 404)).toBe(true)
  })
})

describe('Probe Routes', () => {
  test('프로브 경로는 appRoutes가 아닌 상위 app에서만 제공한다', async () => {
    const responses = await Promise.all([
      appRoutes.request('/startup'),
      appRoutes.request('/health'),
      appRoutes.request('/ready'),
    ])

    expect(responses.every((response) => response.status === 404)).toBe(true)
  })
})
