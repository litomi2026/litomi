'use client'

import { useEffect } from 'react'

import { SCROLL_THRESHOLD_PX, SCROLL_THROTTLE_MS } from '@/constants/policy'
import useThrottledDownScroll from '@/hook/useThrottledScroll'

export default function AutoHideNavigation() {
  const isDownScroll = useThrottledDownScroll({ threshold: SCROLL_THRESHOLD_PX, throttle: SCROLL_THROTTLE_MS })

  useEffect(() => {
    const navigationHeader = document.querySelector('[data-navigation-header]')

    if (isDownScroll) {
      navigationHeader?.setAttribute('aria-busy', 'true')
    } else {
      navigationHeader?.removeAttribute('aria-busy')
    }
  }, [isDownScroll])

  return null
}
