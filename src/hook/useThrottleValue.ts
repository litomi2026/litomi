import { useEffect, useRef, useState } from 'react'

/**
 * 지정한 delay(ms) 동안 값 변경을 한 번으로 제한(throttle)하는 훅
 *
 * @param value  원본 값
 * @param delay  throttle 간격(ms)
 * @returns      throttled 값
 */
export function useThrottleValue<T>(value: T, delay: number): T {
  // 실제로 컴포넌트에 제공될 throttled 값
  const [throttledValue, setThrottledValue] = useState<T>(value)

  // 마지막 업데이트 시각을 기억
  const lastExecutedRef = useRef<number>(Date.now())

  // 시간/의존성 변화에 따라 throttle 로직 수행
  useEffect(() => {
    const now = Date.now()
    const timeSinceLast = now - lastExecutedRef.current

    if (timeSinceLast >= delay) {
      // 지정 간격이 지났다면 즉시 업데이트
      setThrottledValue(value)
      lastExecutedRef.current = now
    } else {
      // 아직 간격이 남았다면 남은 시간만큼 지연 후 업데이트
      const timeoutId = window.setTimeout(() => {
        setThrottledValue(value)
        lastExecutedRef.current = Date.now()
      }, delay - timeSinceLast)

      // value/delay가 바뀌거나 컴포넌트 unmount 시 타이머 정리
      return () => clearTimeout(timeoutId)
    }
  }, [value, delay])

  return throttledValue
}
