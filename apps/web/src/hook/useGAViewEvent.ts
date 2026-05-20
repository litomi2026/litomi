import ms from 'ms'
import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

import { type AnalyticsParams, track } from '@/lib/analytics/browser'

import { useLatestRef } from './useLatestRef'

type Options = {
  eventName: string
  eventParams?: AnalyticsParams
}

const VIEW_EVENT_VISIBLE_DURATION = ms('1 second')

export default function useGAViewEvent({ eventName, eventParams }: Options) {
  const isViewed = useRef(false)
  const eventParamsRef = useLatestRef(eventParams)
  const { ref, inView } = useInView({ threshold: 0.5 })

  useEffect(() => {
    if (!inView || isViewed.current) {
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined

    function scheduleViewEvent() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }

      if (document.visibilityState !== 'visible' || isViewed.current) {
        return
      }

      timer = setTimeout(() => {
        isViewed.current = true
        track(eventName, eventParamsRef.current)
      }, VIEW_EVENT_VISIBLE_DURATION)
    }

    scheduleViewEvent()
    document.addEventListener('visibilitychange', scheduleViewEvent)

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer)
      }

      document.removeEventListener('visibilitychange', scheduleViewEvent)
    }
  }, [eventName, eventParamsRef, inView])

  return { ref }
}
