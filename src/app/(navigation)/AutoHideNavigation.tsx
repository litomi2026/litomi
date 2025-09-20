'use client'

import { useEffect } from 'react'

import useThrottledDownScroll from '@/hook/useThrottledScroll'

export default function AutoHideNavigation() {
  const isDownScroll = useThrottledDownScroll({ threshold: 10, throttle: 300 })

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
