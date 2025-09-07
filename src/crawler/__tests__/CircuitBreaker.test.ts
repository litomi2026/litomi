/**
 * These tests verify the circuit breaker logic without requiring actual database connections
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

  it('should start with circuit closed', () => {
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

  it('should execute successful operations when closed', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const mockOperation = mock(() => Promise.resolve({ id: 1, title: 'Test Manga' }))
    const result = await breaker.execute(mockOperation)

    expect(result).toEqual({ id: 1, title: 'Test Manga' })
    expect(mockOperation).toHaveBeenCalledTimes(1)

    const state = breaker.getState()
    expect(state.state).toBe(0) // Still CLOSED
    expect(state.failureCount).toBe(0)
  })

  it('should open circuit after 5 connection failures', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const connectionError = new Error('connect ECONNREFUSED')
    const mockOperation = mock(() => Promise.reject(connectionError))

    // First 4 failures - circuit remains closed
    for (let i = 1; i <= 4; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('connect ECONNREFUSED')
      const state = breaker.getState()
      expect(state.state).toBe(0) // Still CLOSED
      expect(state.failureCount).toBe(i)
    }

    // 5th failure - circuit opens
    expect(breaker.execute(mockOperation)).rejects.toThrow('connect ECONNREFUSED')
    const state = breaker.getState()
    expect(state.state).toBe(1) // OPEN

    // Subsequent requests fail immediately with CircuitBreakerError
    expect(breaker.execute(mockOperation)).rejects.toThrow(CircuitBreakerError)
    expect(mockOperation).toHaveBeenCalledTimes(5) // No additional calls after circuit opens
  })

  it('should count timeout errors as failures', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const timeoutError = new Error('Query timeout exceeded')
    const mockOperation = mock(() => Promise.reject(timeoutError))

    for (let i = 1; i <= 5; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('Query timeout')
    }

    const state = breaker.getState()
    expect(state.state).toBe(1) // OPEN
  })

  it('should count connection pool errors as failures', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const poolError = new Error('connection pool timeout')
    const mockOperation = mock(() => Promise.reject(poolError))

    for (let i = 1; i <= 5; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('connection pool')
    }

    const state = breaker.getState()
    expect(state.state).toBe(1) // OPEN
  })

  it('should NOT count application errors as failures', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const appError = new Error('Invalid manga ID')
    const mockOperation = mock(() => Promise.reject(appError))

    // Even after 10 application errors, circuit remains closed
    for (let i = 1; i <= 10; i++) {
      expect(breaker.execute(mockOperation)).rejects.toThrow('Invalid manga ID')
    }

    const state = breaker.getState()
    expect(state.state).toBe(0) // Still CLOSED
    expect(state.failureCount).toBe(0) // No failures counted
  })

  it('should handle null/undefined results gracefully', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const mockOperation = mock(() => Promise.resolve(null))
    const result = await breaker.execute(mockOperation)

    expect(result).toBeNull()

    const state = breaker.getState()
    expect(state.state).toBe(0) // CLOSED
    expect(state.failureCount).toBe(0)
  })

  it('should reset failure count on successful request', async () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)

    const connectionError = new Error('connect ECONNREFUSED')
    const failingOperation = mock(() => Promise.reject(connectionError))
    const successfulOperation = mock(() => Promise.resolve({ success: true }))

    // Cause 3 failures
    for (let i = 1; i <= 3; i++) {
      expect(breaker.execute(failingOperation)).rejects.toThrow()
    }

    let state = breaker.getState()
    expect(state.failureCount).toBe(3)

    // One success resets the counter
    await breaker.execute(successfulOperation)

    state = breaker.getState()
    expect(state.state).toBe(0) // Still CLOSED
    expect(state.failureCount).toBe(0) // Reset
  })

  describe('Time-based transitions', () => {
    it('should transition to half-open after timeout', async () => {
      // Mock Date.now() to simulate time passing
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = () => currentTime

      try {
        // Use a very short timeout for faster testing
        const testConfig: CircuitBreakerConfig = {
          ...CIRCUIT_BREAKER_CONFIG,
          timeout: 1000, // Minimum allowed timeout
        }

        const breaker = new CircuitBreaker('TestDB', testConfig)
        const connectionError = new Error('connect ECONNREFUSED')
        const failingOperation = mock(() => Promise.reject(connectionError))
        const successfulOperation = mock(() => Promise.resolve({ success: true }))

        // Open the circuit
        for (let i = 1; i <= 5; i++) {
          expect(breaker.execute(failingOperation)).rejects.toThrow()
        }

        let state = breaker.getState()
        expect(state.state).toBe(1) // OPEN

        // Request fails immediately while open
        expect(breaker.execute(failingOperation)).rejects.toThrow(CircuitBreakerError)

        // Simulate time passing (advance by timeout + buffer)
        currentTime += 1100

        // Next request should be allowed (half-open state)
        // The circuit needs successThreshold + 1 attempts (4 total) in half-open
        // If 3 out of 4 succeed, it closes
        for (let i = 1; i <= 3; i++) {
          await breaker.execute(successfulOperation)
          state = breaker.getState()
          expect(state.state).toBe(2) // Still HALF_OPEN until all attempts complete
        }

        // 4th request completes the half-open evaluation
        await breaker.execute(successfulOperation)

        state = breaker.getState()
        expect(state.state).toBe(0) // CLOSED again after 4/4 successes
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow
      }
    })

    it('should handle mixed success/failure in half-open state', async () => {
      // Mock Date.now() to simulate time passing
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = () => currentTime

      try {
        // Use a short timeout for testing
        const testConfig: CircuitBreakerConfig = {
          ...CIRCUIT_BREAKER_CONFIG,
          timeout: 1000, // 1 second for testing
        }

        const breaker = new CircuitBreaker('TestDB', testConfig)
        const connectionError = new Error('connect ECONNREFUSED')
        const failingOperation = mock(() => Promise.reject(connectionError))
        const successfulOperation = mock(() => Promise.resolve({ success: true }))

        // Open the circuit
        for (let i = 1; i <= 5; i++) {
          expect(breaker.execute(failingOperation)).rejects.toThrow()
        }

        // Simulate time passing to enter half-open
        currentTime += 1100

        // In half-open: 2 successes, then 1 failure, then 1 success
        // Total: 3 successes out of 4 attempts = meets threshold, circuit closes
        await breaker.execute(successfulOperation)
        await breaker.execute(successfulOperation)
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')

        // 4th attempt executes normally (still in half-open)
        await breaker.execute(successfulOperation)

        // After 4 attempts with 3 successes (meets threshold), circuit should close
        const state = breaker.getState()
        expect(state.state).toBe(0) // CLOSED (3/4 successes meets the threshold of 3)
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow
      }
    })

    it('should reopen circuit if half-open recovery fails', async () => {
      // Mock Date.now() to simulate time passing
      const originalDateNow = Date.now
      let currentTime = originalDateNow()
      Date.now = () => currentTime

      try {
        // Use a short timeout for testing
        const testConfig: CircuitBreakerConfig = {
          ...CIRCUIT_BREAKER_CONFIG,
          timeout: 1000, // 1 second for testing
        }

        const breaker = new CircuitBreaker('TestDB', testConfig)
        const connectionError = new Error('connect ECONNREFUSED')
        const failingOperation = mock(() => Promise.reject(connectionError))
        const successfulOperation = mock(() => Promise.resolve({ success: true }))

        // Open the circuit
        for (let i = 1; i <= 5; i++) {
          expect(breaker.execute(failingOperation)).rejects.toThrow()
        }

        // Simulate time passing to enter half-open
        currentTime += 1100

        // In half-open: 1 success, then 3 failures
        // Total: 1 success out of 4 attempts = does not meet threshold, circuit reopens
        await breaker.execute(successfulOperation)
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')
        expect(breaker.execute(failingOperation)).rejects.toThrow('connect ECONNREFUSED')

        // After 4 attempts with only 1 success (below threshold), circuit should reopen
        const state = breaker.getState()
        expect(state.state).toBe(1) // OPEN (1/4 successes does not meet threshold of 3)

        // Future requests should fail immediately
        expect(breaker.execute(successfulOperation)).rejects.toThrow(CircuitBreakerError)
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow
      }
    })
  })

  it('should validate configuration constraints', () => {
    // Test invalid timeout
    expect(() => {
      new CircuitBreaker('Test', { ...CIRCUIT_BREAKER_CONFIG, timeout: 500 })
    }).toThrow('timeout >= 1000ms')

    // Test invalid successThreshold
    expect(() => {
      new CircuitBreaker('Test', { ...CIRCUIT_BREAKER_CONFIG, successThreshold: 0 })
    }).toThrow('successThreshold >= 1')

    // Test invalid failureThreshold
    expect(() => {
      new CircuitBreaker('Test', { ...CIRCUIT_BREAKER_CONFIG, failureThreshold: 0 })
    }).toThrow('failureThreshold >= 1')
  })

  it('should provide accurate state information', () => {
    const breaker = new CircuitBreaker('TestDB', CIRCUIT_BREAKER_CONFIG)
    const state = breaker.getState()

    // Verify all state properties exist
    expect(state).toHaveProperty('state')
    expect(state).toHaveProperty('failureCount')
    expect(state).toHaveProperty('successCount')
    expect(state).toHaveProperty('halfOpenAttempts')
    expect(state).toHaveProperty('halfOpenSuccesses')

    // Verify types
    expect(typeof state.state).toBe('number')
    expect(typeof state.failureCount).toBe('number')
    expect(typeof state.successCount).toBe('number')
    expect(typeof state.halfOpenAttempts).toBe('number')
    expect(typeof state.halfOpenSuccesses).toBe('number')
  })
})
