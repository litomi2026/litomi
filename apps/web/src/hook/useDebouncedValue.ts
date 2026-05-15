import { useEffect, useRef, useState } from 'react'

type Props<T> = {
  value: T
  delay: number
}

export default function useDebouncedValue<T>({ value, delay }: Readonly<Props<T>>) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(debounceTimerRef.current)
  }, [delay, value])

  return debouncedValue
}
