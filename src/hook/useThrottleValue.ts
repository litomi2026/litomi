import { useEffect, useRef, useState } from 'react'

/**
 * 지정한 delay(ms) 동안 값 변경을 한 번으로 제한(throttle)하는 훅
 *
 * @param value  원본 값
 * @param delay  throttle 간격(ms)
 * @returns      throttled 값
 */
export function useThrottleValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecutionTimeRef = useRef(0)
  const latestValueRef = useRef<T>(value)
  const previousValueRef = useRef<T>(value)
  const isFirstEffectRef = useRef(true)
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    latestValueRef.current = value
    previousValueRef.current = value

    // delay가 유효하지 않거나 0 이하라면 throttle 없이 즉시 동기화해요.
    if (!Number.isFinite(delay) || delay <= 0) {
      clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = undefined
      lastExecutionTimeRef.current = 0
      setThrottledValue(value)
      return
    }

    // 첫 effect 실행(마운트 직후)에는 throttle window를 시작하지 않아요.
    // (마운트 직후 빠르게 값이 바뀌는 케이스에서 첫 변화가 지연되지 않도록)
    if (isFirstEffectRef.current) {
      isFirstEffectRef.current = false
      if (value === previousValueRef.current) {
        return
      }
    }

    const now = Date.now()
    const lastExecutionTime = lastExecutionTimeRef.current

    // 첫 값 변화는 즉시 반영(leading)해요.
    if (lastExecutionTime === 0) {
      clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = undefined
      lastExecutionTimeRef.current = now
      setThrottledValue(value)
      return
    }

    const nextAllowedTime = lastExecutionTime + delay

    // throttle window 밖이면 즉시 반영해요.
    if (now >= nextAllowedTime) {
      clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = undefined
      lastExecutionTimeRef.current = now
      setThrottledValue(value)
      return
    }

    // window 안이면 마지막 값(trailing)을 window 끝에 한 번 반영해요.
    clearTimeout(throttleTimerRef.current)
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = undefined
      lastExecutionTimeRef.current = Date.now()
      setThrottledValue(latestValueRef.current)
    }, nextAllowedTime - now)

    return () => clearTimeout(throttleTimerRef.current)
  }, [delay, value])

  return throttledValue
}
