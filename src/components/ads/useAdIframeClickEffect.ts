'use client'

import ms from 'ms'
import { type RefObject, useEffect, useRef } from 'react'

import { useLatestRef } from '../../hook/useLatestRef'

type Options = {
  enabled: boolean
  containerRef: RefObject<HTMLElement | null>
  onConfirmedNavigation: () => void
  graceMs?: number
}

const DEFAULT_GRACE_MS = ms('400ms')

export function useAdIframeClickEffect({
  enabled,
  containerRef,
  onConfirmedNavigation,
  graceMs = DEFAULT_GRACE_MS,
}: Options) {
  const lastIframeFocusAtRef = useRef<number | null>(null)
  const onConfirmedNavigationRef = useLatestRef(onConfirmedNavigation)

  // NOTE: iframe focus → (window blur | document hidden) 조합으로 광고 클릭으로 추정해요
  useEffect(() => {
    if (!enabled) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const safeContainer: HTMLElement = container

    function handleSlotFocus(event: FocusEvent) {
      if (event.target instanceof HTMLIFrameElement) {
        lastIframeFocusAtRef.current = Date.now()
      }
    }

    function handleConfirmedAdNavigation() {
      const now = Date.now()
      const lastFocusedAt = lastIframeFocusAtRef.current
      const activeElement = document.activeElement
      const activeIsIframeInThisSlot =
        activeElement instanceof HTMLIFrameElement && safeContainer.contains(activeElement)

      if (lastFocusedAt === null) {
        if (!activeIsIframeInThisSlot) {
          return
        }
      } else if (now - lastFocusedAt > graceMs) {
        if (!activeIsIframeInThisSlot) {
          return
        }
      }

      // blur + hidden 연속 발생 등으로 중복 처리되지 않게 먼저 소진해요.
      lastIframeFocusAtRef.current = null
      onConfirmedNavigationRef.current()
    }

    function handleWindowBlur() {
      handleConfirmedAdNavigation()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        handleConfirmedAdNavigation()
      }
    }

    // NOTE: focus는 버블링되지 않지만 캡처링은 되므로(= true) iframe focus를 더 안정적으로 잡아요.
    safeContainer.addEventListener('focus', handleSlotFocus, true)
    window.addEventListener('blur', handleWindowBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      safeContainer.removeEventListener('focus', handleSlotFocus, true)
      window.removeEventListener('blur', handleWindowBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, containerRef, graceMs, onConfirmedNavigationRef])
}
