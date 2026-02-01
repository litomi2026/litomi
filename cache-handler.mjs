import { RedisCacheHandler } from '@mrjasonroy/cache-components-cache-handler'

export default class NextCacheHandler extends RedisCacheHandler {
  constructor(options = {}) {
    super({
      ...options,
      redis: process.env.REDIS_URL,
    })
  }

  async get(key) {
    const entry = await super.get(key)

    if (entry?.value?.kind === 'FETCH' && entry.value.body) {
      // 라이브러리가 JSON.parse로 데이터를 복원하므로,
      // body는 스트림 메서드가 없는 단순 객체(Buffer 형태)이거나 문자열입니다.
      // Next.js가 기대하는 Web ReadableStream으로 변환해 줍니다.
      if (typeof entry.value.body.pipeTo !== 'function') {
        const bodyData = entry.value.body

        try {
          entry.value.body = new ReadableStream({
            start(controller) {
              // 1. { type: 'Buffer', data: [...] } 형태의 Buffer 객체인 경우
              if (bodyData?.type === 'Buffer' && Array.isArray(bodyData.data)) {
                controller.enqueue(new Uint8Array(bodyData.data))
              }
              // 2. 문자열인 경우
              else if (typeof bodyData === 'string') {
                controller.enqueue(new TextEncoder().encode(bodyData))
              }
              // 3. 그 외 (이미 Uint8Array 등)
              else {
                controller.enqueue(bodyData)
              }
              controller.close()
            },
          })
        } catch (error) {
          console.error(`[CacheHandler] Failed to convert body to stream for key ${key}:`, error)
          return null // 변환 실패 시 캐시 미스로 처리 (재생성 유도)
        }
      }
    }

    return entry
  }
}
