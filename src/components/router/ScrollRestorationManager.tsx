'use client'

import { useEffect } from 'react'

import { setPendingHistoryScrollRestore } from '@/utils/history-scroll-restoration'

export default function ScrollRestorationManager() {
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    if (isBackForwardNavigation()) {
      setPendingHistoryScrollRestore()
    }

    function handlePopState() {
      setPendingHistoryScrollRestore()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previousScrollRestoration
      }
    }
  }, [])

  return null
}

function isBackForwardNavigation() {
  const navigationEntries = performance.getEntriesByType('navigation')
  const navigation = navigationEntries[0]

  if (typeof PerformanceNavigationTiming !== 'undefined' && navigation instanceof PerformanceNavigationTiming) {
    return navigation.type === 'back_forward'
  }

  return Boolean(navigation && 'type' in navigation && navigation.type === 'back_forward')
}
