import ms from 'ms'
import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

import { track } from '@/lib/analytics/browser'

import { useLatestRef } from './useLatestRef'

type Options = {
  eventName: string
  eventParams?: Record<string, string>
}

export default function useGAViewEvent({ eventName, eventParams }: Options) {
  const isViewed = useRef(false)
  const eventParamsRef = useLatestRef(eventParams)
  const { ref, inView } = useInView({ threshold: 0.5 })

  useEffect(() => {
    if (inView && !isViewed.current) {
      const timer = setTimeout(() => {
        isViewed.current = true
        track(eventName, eventParamsRef.current)
      }, ms('3 seconds'))

      return () => clearTimeout(timer)
    }
  }, [eventName, eventParamsRef, inView])

  return { ref }
}
