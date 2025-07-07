import { captureException } from '@sentry/nextjs'

import { CircuitBreakerError } from './errors'

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number // CLOSED -> OPEN
  successThreshold: number // HALF_OPEN -> CLOSED
  timeout: number // OPEN -> HALF_OPEN
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  successThreshold: 3,
  timeout: 60000, // 1 minute
}

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export class CircuitBreaker {
  private failureCount = 0
  private halfOpenAttempts = 0
  private readonly halfOpenRequests: number
  private halfOpenSuccesses = 0
  private lastFailureTime?: number
  private state: CircuitState = CircuitState.CLOSED
  private successCount = 0

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG,
  ) {
    this.halfOpenRequests = config.successThreshold + 1

    if (config.timeout < 1000) {
      throw new Error(`CircuitBreaker - ${name}: timeout >= 1000ms 이어야 합니다.`)
    }

    if (config.successThreshold < 1) {
      throw new Error(`CircuitBreaker - ${name}: successThreshold >= 1 이어야 합니다.`)
    }

    if (config.failureThreshold < 1) {
      throw new Error(`CircuitBreaker - ${name}: failureThreshold >= 1 이어야 합니다.`)
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - (this.lastFailureTime || 0) < this.config.timeout) {
        throw new CircuitBreakerError(`Circuit breaker is open for ${this.name}`)
      }

      // NOTE: timeout 시간이 지나면 HALF_OPEN 상태로 전환 (CircuitState.OPEN -> CircuitState.HALF_OPEN)
      this.state = CircuitState.HALF_OPEN
      this.halfOpenAttempts = 0
      this.halfOpenSuccesses = 0
    }

    if (this.state === CircuitState.HALF_OPEN && this.halfOpenAttempts >= this.halfOpenRequests) {
      throw new CircuitBreakerError(`Circuit breaker is half-open and at capacity for ${this.name}`)
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      halfOpenAttempts: this.halfOpenAttempts,
      halfOpenSuccesses: this.halfOpenSuccesses,
    }
  }

  private checkAllHalfOpenRequestsCompleted() {
    if (this.halfOpenAttempts >= this.halfOpenRequests) {
      // NOTE: 모든 요청이 완료되었으면 성공률 확인 후 차단 여부 결정 (CircuitState.HALF_OPEN -> CircuitState.CLOSED or CircuitState.OPEN)
      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.failureCount = 0
        this.successCount = 0
      } else {
        this.state = CircuitState.OPEN
        this.lastFailureTime = Date.now()
      }
    }
  }

  private onFailure() {
    if (this.state === CircuitState.CLOSED) {
      this.failureCount++

      // NOTE: 너무 많이 실패하면 이후 요청 차단 (CircuitState.CLOSED -> CircuitState.OPEN)
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN
        this.lastFailureTime = Date.now()
        captureException(new Error(`Circuit breaker opened for ${this.name}`), {
          tags: { circuit_breaker: this.name },
          extra: { failureCount: this.failureCount },
        })
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++
      this.checkAllHalfOpenRequestsCompleted()
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++
      this.halfOpenSuccesses++
      this.checkAllHalfOpenRequestsCompleted()
    }
  }
}
