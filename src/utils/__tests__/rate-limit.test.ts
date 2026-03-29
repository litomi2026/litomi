import { describe, expect, spyOn, test } from 'bun:test'

import { MemoryStore, RateLimiter, RateLimitPresets } from '../rate-limit'

describe('RateLimiter', () => {
  describe('MemoryStore', () => {
    test('새 키에 대해 카운트를 증가시킨다', async () => {
      const store = new MemoryStore(60000)
      const result = await store.increment('test-key')

      expect(result.count).toBe(1)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    test('기존 키의 카운트를 증가시킨다', async () => {
      const store = new MemoryStore(60000)
      await store.increment('test-key')
      const result = await store.increment('test-key')

      expect(result.count).toBe(2)
    })

    test('만료된 항목을 정리한다', async () => {
      const store = new MemoryStore(100) // 100ms 윈도우
      await store.increment('test-key')

      // 만료될 때까지 기다린다.
      await new Promise((resolve) => setTimeout(resolve, 150))
      await store.cleanup()

      const result = await store.increment('test-key')
      expect(result.count).toBe(1) // 정리 후 다시 1부터 시작한다.
    })

    test('카운트를 감소시킨다', async () => {
      const store = new MemoryStore(60000)
      await store.increment('test-key')
      await store.increment('test-key')
      await store.decrement('test-key')

      const result = await store.increment('test-key')
      expect(result.count).toBe(2) // 2에서 1로 줄었다가 다시 증가해 2가 된다.
    })
  })

  describe('RateLimiter', () => {
    test('제한 이내의 요청은 허용한다', async () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 5,
      })

      const result = await limiter.check('user1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    test('제한을 초과한 요청은 차단한다', async () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 2,
      })

      await limiter.check('user1')
      await limiter.check('user1')
      const result = await limiter.check('user1')

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    test('서로 다른 식별자는 별도로 추적한다', async () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 1,
      })

      await limiter.check('user1')
      const user1Result = await limiter.check('user1')
      const user2Result = await limiter.check('user2')

      expect(user1Result.allowed).toBe(false)
      expect(user2Result.allowed).toBe(true)
    })

    test('설정된 경우 성공한 요청에 보상을 적용한다', async () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 3,
      })

      await limiter.check('user1')
      await limiter.check('user1')
      expect((await limiter.check('user1')).remaining).toBe(0)

      await limiter.reward('user1')

      const result = await limiter.check('user1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0) // 하나를 돌려받은 뒤 바로 다시 사용했다.
    })

    test('식별자의 레이트리밋을 초기화한다', async () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 2,
      })

      await limiter.check('user1')
      await limiter.check('user1')
      await limiter.reset('user1')

      const result = await limiter.check('user1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    test('사용자 지정 키 접두사를 사용한다', async () => {
      const store = new MemoryStore(60000)
      const incrementSpy = spyOn(store, 'increment')

      const limiter = new RateLimiter(
        {
          windowMs: 60000,
          maxAttempts: 5,
          keyPrefix: 'custom:',
        },
        store,
      )

      await limiter.check('user1')

      expect(incrementSpy).toHaveBeenCalledWith('custom:user1')
    })
  })

  describe('프리셋', () => {
    test('balanced 프리셋을 생성한다', () => {
      const config = RateLimitPresets.balanced()
      expect(config.windowMs).toBe(5 * 60 * 1000)
      expect(config.maxAttempts).toBe(10)
    })

    test('strict 프리셋을 생성한다', () => {
      const config = RateLimitPresets.strict()
      expect(config.windowMs).toBe(15 * 60 * 1000)
      expect(config.maxAttempts).toBe(10)
    })

    test('standard 프리셋을 생성한다', () => {
      const config = RateLimitPresets.standard()
      expect(config.windowMs).toBe(15 * 60 * 1000)
      expect(config.maxAttempts).toBe(100)
    })
  })
})
