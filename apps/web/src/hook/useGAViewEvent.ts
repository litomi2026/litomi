import ms from 'ms'
import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

import { type AnalyticsParams, track } from '@/lib/analytics/browser'

import { useLatestRef } from './useLatestRef'

type Options = {
  cooldownKey?: string
  cooldownMs?: number
  eventName: string
  eventParams?: AnalyticsParams
}

const VIEW_EVENT_VISIBLE_DURATION = ms('1 second')
const viewEventCooldownMsByKey = new Map<string, number>()

type ViewEventTrackingState = {
  cooldownKey?: string
  cooldownMs?: number
  isViewed: { current: boolean }
}

export default function useGAViewEvent({ cooldownKey, cooldownMs = ms('1 minute'), eventName, eventParams }: Options) {
  const isViewed = useRef(false)
  const eventParamsRef = useLatestRef(eventParams)
  const { ref, inView } = useInView({ threshold: 0.5 })

  useEffect(() => {
    if (!inView || isViewEventTracked({ cooldownKey, cooldownMs, isViewed })) {
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined

    function scheduleViewEvent() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }

      if (document.visibilityState !== 'visible' || isViewEventTracked({ cooldownKey, cooldownMs, isViewed })) {
        return
      }

      timer = setTimeout(() => {
        if (isViewEventTracked({ cooldownKey, cooldownMs, isViewed })) {
          return
        }

        markViewEventTracked({ cooldownKey, isViewed })
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
  }, [cooldownKey, cooldownMs, eventName, eventParamsRef, inView])

  return { ref }
}

function isViewEventTracked({ cooldownKey, cooldownMs = 0, isViewed }: ViewEventTrackingState) {
  if (!cooldownKey || cooldownMs <= 0) {
    return isViewed.current
  }

  const trackedAt = viewEventCooldownMsByKey.get(cooldownKey)
  return trackedAt !== undefined && Date.now() - trackedAt < cooldownMs
}

function markViewEventTracked({ cooldownKey, isViewed }: ViewEventTrackingState) {
  isViewed.current = true

  if (cooldownKey) {
    viewEventCooldownMsByKey.set(cooldownKey, Date.now())
  }
}
