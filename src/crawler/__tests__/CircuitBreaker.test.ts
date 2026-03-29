/**
 * 실제 데이터베이스 연결 없이 서킷 브레이커 로직을 검증하는 테스트다.
 */

import { describe, expect, it, mock } from 'bun:test'
import ms from 'ms'

import { CircuitBreaker, CircuitBreakerConfig } from '../CircuitBreaker'
import { CircuitBreakerError } from '../errors'

describe('CircuitBreaker', () => {
  const CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: ms('2 minutes'),
    shouldCountAsFailure: (error: unknown) => {
      if (error instanceof Error) {
        return (
          error.message.includes('connect') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('connection') ||
          error.message.includes('pool')
        )
      }
      return true
    },
  }

  it('초기 상태는 닫힘이어야 한다', () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)
    const state = breaker.getState()

    expect(state).toMatchObject({
      state: 0, // CircuitState.CLOSED
      failureCount: 0,
      successCount: 0,
      halfOpenAttempts: 0,
      halfOpenSuccesses: 0,
    })
  })

  it('닫힌 상태에서는 성공한 작업을 실행한다', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const mockOperation = mock(() => Promise.resolve({ id: 1, title: 'Test Manga' }))
    const result = await breaker.execute(mockOperation)

    expect(result).toEqual({ id: 1, title: 'Test Manga' })
    expect(mockOperation).toHaveBeenCalledTimes(1)

    const state = breaker.getState()
    expect(state.state).toBe(0) // 여전히 CLOSED 상태다.
    expect(state.failureCount).toBe(0)
  })

  it('연결 실패가 5번 누적되면 서킷을 연다', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const connectionError = new Error('connect ECONNREFUSED')
    const mockOperation = mock(() => Promise.reject(connectionError))

    // 처음 4번 실패할 때까지는 서킷이 닫혀 있어야 한다.
    for (let i = 1; i <= 4; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('connect ECONNREFUSED')
      const state = breaker.getState()
      expect(state.state).toBe(0) // 여전히 CLOSED 상태다.
      expect(state.failureCount).toBe(i)
    }

    // 5번째 실패에서 서킷이 열린다.
    expect(breaker.execute(mockOperation)).rejects.toThrow('connect ECONNREFUSED')
    const state = breaker.getState()
    expect(state.state).toBe(1) // OPEN 상태다.

    // 이후 요청은 즉시 CircuitBreakerError로 실패해야 한다.
    expect(breaker.execute(mockOperation)).rejects.toThrow(CircuitBreakerError)
    expect(mockOperation).toHaveBeenCalledTimes(5) // 서킷이 열린 뒤에는 추가 호출이 없어야 한다.
  })

  it('타임아웃 오류를 실패로 집계한다', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const timeoutError = new Error('Query timeout exceeded')
    const mockOperation = mock(() => Promise.reject(timeoutError))

    for (let i = 1; i <= 5; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('Query timeout')
    }

    const state = breaker.getState()
    expect(state.state).toBe(1) // OPEN 상태다.
  })

  it('커넥션 풀 오류를 실패로 집계한다', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const poolError = new Error('connection pool timeout')
    const mockOperation = mock(() => Promise.reject(poolError))

    for (let i = 1; i <= 5; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('connection pool')
    }

    const state = breaker.getState()
    expect(state.state).toBe(1) // OPEN 상태다.
  })

  it('애플리케이션 오류는 실패로 집계하지 않는다', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const appError = new Error('Invalid manga ID')
    const mockOperation = mock(() => Promise.reject(appError))

    // 애플리케이션 오류가 10번 나도 서킷은 닫힌 상태를 유지해야 한다.
    for (let i = 1; i <= 10; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('Invalid manga ID')
    }

    const state = breaker.getState()
    expect(state.state).toBe(0) // 여전히 CLOSED 상태다.
    expect(state.failureCount).toBe(0) // 실패 횟수로 집계되지 않는다.
  })

  it('null/undefined 결과도 무리 없이 처리한다', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const mockOperation = mock(() => Promise.resolve(null))
    const result = await breaker.execute(mockOperation)

    expect(result).toBeNull()

    const state = breaker.getState()
    expect(state.state).toBe(0) // CLOSED 상태다.
    expect(state.failureCount).toBe(0)
  })

  it('성공한 요청이 오면 실패 횟수를 초기화한다', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const connectionError = new Error('connect ECONNREFUSED')
    const failingOperation = mock(() => Promise.reject(connectionError))
    const successfulOperation = mock(() => Promise.resolve({ success: true }))

    // 실패를 3번 누적시킨다.
    for (let i = 1; i <= 3; i++) {
      expect(breaker.execute(failingOperation)).rejects.toThrow()
    }

    let state = breaker.getState()
    expect(state.failureCount).toBe(3)

    // 성공이 한 번 오면 카운터가 초기화돼야 한다.
    await breaker.execute(successfulOperation)

    state = breaker.getState()
    expect(state.state).toBe(0) // 여전히 CLOSED 상태다.
    expect(state.failureCount).toBe(0) // 카운터가 초기화된다.
  })

  describe('시간 기반 전이', () => {
    it('타임아웃이 지나면 반열림 상태로 전이한다', async () => {
      // 시간이 흐른 상황을 만들기 위해 Date.now()를 모의한다.
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = () => currentTime

      try {
        // 더 빠르게 검증하려고 아주 짧은 타임아웃을 사용한다.
        const testConfig: CircuitBreakerConfig = {
          ...CIRCUIT_BREAKER_CONFIG,
          timeout: 1000, // 허용 가능한 최소 타임아웃
        }

        const breaker = new CircuitBreaker('TestDB', testConfig)
        const connectionError = new Error('connect ECONNREFUSED')
        const failingOperation = mock(() => Promise.reject(connectionError))
        const successfulOperation = mock(() => Promise.resolve({ success: true }))

        // 서킷을 연다.
        for (let i = 1; i <= 5; i++) {
          expect(breaker.execute(failingOperation)).rejects.toThrow()
        }

        let state = breaker.getState()
        expect(state.state).toBe(1) // OPEN 상태다.

        // 열려 있는 동안 요청은 즉시 실패해야 한다.
        expect(breaker.execute(failingOperation)).rejects.toThrow(CircuitBreakerError)

        // 시간이 흐른 것으로 처리한다(타임아웃 + 여유 시간).
        currentTime += 1100

        // 다음 요청부터는 반열림 상태로 허용돼야 한다.
        // 반열림에서는 successThreshold + 1회(총 4회)를 평가한다.
        // 4회 중 3회 이상 성공하면 다시 닫힌다.
        for (let i = 1; i <= 3; i++) {
          await breaker.execute(successfulOperation)
          state = breaker.getState()
          expect(state.state).toBe(2) // 평가가 끝날 때까지 HALF_OPEN 상태를 유지한다.
        }

        // 4번째 요청으로 반열림 평가가 끝난다.
        await breaker.execute(successfulOperation)

        state = breaker.getState()
        expect(state.state).toBe(0) // 4/4 성공으로 다시 CLOSED 상태가 된다.
      } finally {
        // 원래 Date.now를 복원한다.
        Date.now = originalDateNow
      }
    })

    it('반열림 상태에서 성공과 실패가 섞여도 올바르게 처리한다', async () => {
      // 시간이 흐른 상황을 만들기 위해 Date.now()를 모의한다.
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = () => currentTime

      try {
        // 테스트용으로 짧은 타임아웃을 사용한다.
        const testConfig: CircuitBreakerConfig = {
          ...CIRCUIT_BREAKER_CONFIG,
          timeout: 1000, // 테스트용 1초 타임아웃
        }

        const breaker = new CircuitBreaker('TestDB', testConfig)
        const connectionError = new Error('connect ECONNREFUSED')
        const failingOperation = mock(() => Promise.reject(connectionError))
        const successfulOperation = mock(() => Promise.resolve({ success: true }))

        // 서킷을 연다.
        for (let i = 1; i <= 5; i++) {
          expect(breaker.execute(failingOperation)).rejects.toThrow()
        }

        // 반열림 상태로 진입할 만큼 시간이 흐른다.
        currentTime += 1100

        // 반열림 상태에서 2번 성공, 1번 실패, 1번 성공이 발생한다.
        // 총 4회 중 3회 성공이므로 임계치를 만족해 서킷은 닫혀야 한다.
        await breaker.execute(successfulOperation)
        await breaker.execute(successfulOperation)
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')

        // 4번째 시도도 정상 실행된다(여전히 반열림 상태).
        await breaker.execute(successfulOperation)

        // 4회 중 3회 성공이면 임계치를 만족해 서킷이 닫혀야 한다.
        const state = breaker.getState()
        expect(state.state).toBe(0) // 3/4 성공으로 임계치를 만족해 CLOSED 상태가 된다.
      } finally {
        // 원래 Date.now를 복원한다.
        Date.now = originalDateNow
      }
    })

    it('반열림 복구가 실패하면 서킷을 다시 연다', async () => {
      // 시간이 흐른 상황을 만들기 위해 Date.now()를 모의한다.
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = () => currentTime

      try {
        // 테스트용으로 짧은 타임아웃을 사용한다.
        const testConfig: CircuitBreakerConfig = {
          ...CIRCUIT_BREAKER_CONFIG,
          timeout: 1000, // 테스트용 1초 타임아웃
        }

        const breaker = new CircuitBreaker('TestDB', testConfig)
        const connectionError = new Error('connect ECONNREFUSED')
        const failingOperation = mock(() => Promise.reject(connectionError))
        const successfulOperation = mock(() => Promise.resolve({ success: true }))

        // 서킷을 연다.
        for (let i = 1; i <= 5; i++) {
          expect(breaker.execute(failingOperation)).rejects.toThrow()
        }

        // 반열림 상태로 진입할 만큼 시간이 흐른다.
        currentTime += 1100

        // 반열림 상태에서 1번 성공 후 3번 실패한다.
        // 총 4회 중 1회 성공이므로 임계치를 못 채워 서킷이 다시 열려야 한다.
        await breaker.execute(successfulOperation)
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')

        // 4회 중 1회 성공으로는 부족하므로 서킷이 다시 열려야 한다.
        const state = breaker.getState()
        expect(state.state).toBe(1) // 1/4 성공으로는 부족해 OPEN 상태가 된다.

        // 이후 요청은 즉시 실패해야 한다.
        expect(breaker.execute(successfulOperation)).rejects.toThrow(CircuitBreakerError)
      } finally {
        // 원래 Date.now를 복원한다.
        Date.now = originalDateNow
      }
    })
  })

  it('설정 제약 조건을 검증한다', () => {
    // 잘못된 timeout 값을 검증한다.
    expect(() => {
      new CircuitBreaker('Test', { ...CIRCUIT_BREAKER_CONFIG, timeout: 500 })
    }).toThrow('timeout >= 1000ms')

    // 잘못된 successThreshold 값을 검증한다.
    expect(() => {
      new CircuitBreaker('Test', { ...CIRCUIT_BREAKER_CONFIG, successThreshold: 0 })
    }).toThrow('successThreshold >= 1')

    // 잘못된 failureThreshold 값을 검증한다.
    expect(() => {
      new CircuitBreaker('Test', { ...CIRCUIT_BREAKER_CONFIG, failureThreshold: 0 })
    }).toThrow('failureThreshold >= 1')
  })

  it('정확한 상태 정보를 제공한다', () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)
    const state = breaker.getState()

    // 필요한 상태 속성이 모두 있는지 확인한다.
    expect(state).toHaveProperty('state')
    expect(state).toHaveProperty('failureCount')
    expect(state).toHaveProperty('successCount')
    expect(state).toHaveProperty('halfOpenAttempts')
    expect(state).toHaveProperty('halfOpenSuccesses')

    // 각 속성 타입을 확인한다.
    expect(typeof state.state).toBe('number')
    expect(typeof state.failureCount).toBe('number')
    expect(typeof state.successCount).toBe('number')
    expect(typeof state.halfOpenAttempts).toBe('number')
    expect(typeof state.halfOpenSuccesses).toBe('number')
  })
})
