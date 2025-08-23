import { useEffect, useRef, useState } from 'react'

type Options = {
  threshold: number
  throttle: number
}

export default function useThrottledDownScroll({ threshold, throttle }: Options) {
  const [isDownScroll, setIsDownScroll] = useState(false)
  const lastScrollY = useRef(0)
  const lastExecutionTime = useRef(0)

  useEffect(() => {
    function handleScroll() {
      const now = Date.now()

      if (now - lastExecutionTime.current >= throttle) {
        const currentScrollY = window.scrollY

        if (currentScrollY > threshold && currentScrollY > lastScrollY.current) {
          setIsDownScroll(true)
        } else if (currentScrollY < lastScrollY.current) {
          setIsDownScroll(false)
        }

        lastScrollY.current = currentScrollY
        lastExecutionTime.current = now
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold, throttle])

  return isDownScroll
}
