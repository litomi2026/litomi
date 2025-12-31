'use client'

import ms from 'ms'
import { type RefObject, useEffect } from 'react'

import { useLatestRef } from '../../hook/useLatestRef'

type Options = {
  enabled: boolean
  containerRef: RefObject<HTMLElement | null>
  timeoutMs?: number
  onLoaded?: () => void
  onBlocked?: () => void
}

const DEFAULT_TIMEOUT_MS = ms('10 seconds')

export function useAdIframeLoadEffect({
  enabled,
  containerRef,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onLoaded,
  onBlocked,
}: Options) {
  const onLoadedRef = useLatestRef(onLoaded)
  const onBlockedRef = useLatestRef(onBlocked)

  // NOTE: MutationObserver를 사용해 iframe 로드 상태를 구독해요
  useEffect(() => {
    if (!enabled) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    let isMounted = true

    function hasIframe(slot: HTMLElement) {
      return Boolean(slot.querySelector('iframe'))
    }

    // NOTE: 이미 로드된 상태라면 즉시 처리해요
    if (hasIframe(container)) {
      onLoadedRef.current?.()
      return
    }

    const observer = new MutationObserver(() => {
      if (!isMounted) {
        return
      }

      if (hasIframe(container)) {
        observer.disconnect()
        onLoadedRef.current?.()
      }
    })

    observer.observe(container, { childList: true, subtree: true })

    const timeoutId = setTimeout(() => {
      if (!isMounted) {
        return
      }

      if (!hasIframe(container)) {
        onBlockedRef.current?.()
      }

      observer.disconnect()
    }, timeoutMs)

    return () => {
      isMounted = false
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [enabled, containerRef, onBlockedRef, onLoadedRef, timeoutMs])
}
