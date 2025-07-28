import { describe, expect, spyOn, test } from 'bun:test'

import { MemoryStore, RateLimiter, RateLimitPresets } from '../rate-limit'

describe('RateLimiter', () => {
  describe('MemoryStore', () => {
    test('should increment count for new keys', async () => {
      const store = new MemoryStore(60000)
      const result = await store.increment('test-key')

      expect(result.count).toBe(1)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    test('should increment existing keys', async () => {
      const store = new MemoryStore(60000)
      await store.increment('test-key')
      const result = await store.increment('test-key')

      expect(result.count).toBe(2)
    })

    test('should cleanup expired entries', async () => {
      const store = new MemoryStore(100) // 100ms window
      await store.increment('test-key')

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 150))
      await store.cleanup()

      const result = await store.increment('test-key')
      expect(result.count).toBe(1) // Reset after cleanup
    })

    test('should decrement count', async () => {
      const store = new MemoryStore(60000)
      await store.increment('test-key')
      await store.increment('test-key')
      await store.decrement('test-key')

      const result = await store.increment('test-key')
      expect(result.count).toBe(2) // Was 2, decremented to 1, then incremented to 2
    })
  })

  describe('RateLimiter', () => {
    test('should allow requests within limit', async () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 5,
      })

      const result = await limiter.check('user1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    test('should block requests exceeding limit', async () => {
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

    test('should track different identifiers separately', async () => {
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

    test('should reward successful requests when configured', async () => {
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxAttempts: 3,
        skipSuccessfulRequests: true,
      })

      await limiter.check('user1')
      await limiter.check('user1')
      expect((await limiter.check('user1')).remaining).toBe(0)

      await limiter.reward('user1')

      const result = await limiter.check('user1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0) // One was given back, then consumed
    })

    test('should reset rate limit for identifier', async () => {
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

    test('should use custom key prefix', async () => {
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

  describe('Presets', () => {
    test('should create strict rate limiter', () => {
      const config = RateLimitPresets.strict()
      expect(config.windowMs).toBe(15 * 60 * 1000)
      expect(config.maxAttempts).toBe(5)
    })

    test('should create standard rate limiter', () => {
      const config = RateLimitPresets.standard()
      expect(config.windowMs).toBe(15 * 60 * 1000)
      expect(config.maxAttempts).toBe(100)
    })
  })
})
