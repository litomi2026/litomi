'use client'

import { useEffect, useEffectEvent, useRef } from 'react'

import {
  clearPendingHistoryScrollRestore,
  createScrollRestoreSnapshot,
  findScrollAnchorForSnapshot,
  getCurrentScrollRestoreUrl,
  getHistoryScrollRestoreSnapshot,
  getPendingHistoryScrollRestore,
  getScrollAnchorDocumentTop,
  type ScrollRestoreSnapshot,
  setHistoryScrollRestoreSnapshot,
} from '@/utils/history-scroll-restoration'

const INITIAL_RESTORE_GRACE_MS = 500
const RESTORE_RETRY_DELAY_MS = 120
const RESTORE_TIMEOUT_MS = 5000
const RESTORE_MAX_ATTEMPTS = 40
const SAVE_SCROLL_THROTTLE_MS = 120

type Params = {
  enabled?: boolean
  fetchNextPage: () => Promise<unknown> | void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  restoreKey: string
}

type RestoreController = {
  attempts: number
  lastFetchAt: number
  startedAt: number
  snapshot: ScrollRestoreSnapshot
}

export default function useInfiniteListScrollRestoration({
  enabled = true,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  restoreKey,
}: Params) {
  const restoreControllerRef = useRef<RestoreController | null>(null)
  const restoreTimerRef = useRef<number | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  const saveScrollPosition = useEffectEvent(() => {
    if (!enabled || restoreControllerRef.current) {
      return
    }

    const snapshot = createScrollRestoreSnapshot()

    if (!snapshot) {
      return
    }

    setHistoryScrollRestoreSnapshot(restoreKey, snapshot)
  })

  const finishRestore = useEffectEvent(() => {
    clearPendingHistoryScrollRestore()
    restoreControllerRef.current = null

    if (restoreTimerRef.current !== null) {
      window.clearInterval(restoreTimerRef.current)
      restoreTimerRef.current = null
    }

    saveScrollPosition()
  })

  const runRestoreAttempt = useEffectEvent(() => {
    const controller = restoreControllerRef.current

    if (!controller) {
      return
    }

    controller.attempts += 1

    const anchor = findScrollAnchorForSnapshot(controller.snapshot)

    if (anchor) {
      const anchorTargetY = Math.round(getScrollAnchorDocumentTop(anchor) + controller.snapshot.anchorOffset)

      if (canScrollTo(anchorTargetY)) {
        window.scrollTo({ top: anchorTargetY })
        finishRestore()
        return
      }
    }

    const elapsed = Date.now() - controller.startedAt
    const hasTimedOut = elapsed >= RESTORE_TIMEOUT_MS || controller.attempts >= RESTORE_MAX_ATTEMPTS
    const hasPassedInitialGrace = elapsed >= INITIAL_RESTORE_GRACE_MS
    const canRequestNextPage = Boolean(hasNextPage) && !isFetchingNextPage

    if (canRequestNextPage && Date.now() - controller.lastFetchAt >= RESTORE_RETRY_DELAY_MS) {
      controller.lastFetchAt = Date.now()
      void Promise.resolve(fetchNextPage()).catch(() => undefined)
    }

    if (hasPassedInitialGrace && !hasNextPage && !isFetchingNextPage) {
      if (canScrollTo(controller.snapshot.scrollY)) {
        window.scrollTo({ top: controller.snapshot.scrollY })
      }

      finishRestore()
      return
    }

    if (hasTimedOut) {
      if (canScrollTo(controller.snapshot.scrollY)) {
        window.scrollTo({ top: controller.snapshot.scrollY })
      }

      finishRestore()
      return
    }
  })

  useEffect(() => {
    if (!enabled || restoreControllerRef.current) {
      return
    }

    const pendingRestore = getPendingHistoryScrollRestore()
    const currentUrl = getCurrentScrollRestoreUrl()

    if (!pendingRestore || pendingRestore.url !== currentUrl) {
      return
    }

    const snapshot = getHistoryScrollRestoreSnapshot(restoreKey)

    if (!snapshot || snapshot.url !== currentUrl) {
      clearPendingHistoryScrollRestore()
      return
    }

    restoreControllerRef.current = {
      attempts: 0,
      lastFetchAt: 0,
      snapshot,
      startedAt: Date.now(),
    }
  }, [enabled, restoreKey])

  useEffect(() => {
    if (!enabled || !restoreControllerRef.current) {
      return
    }

    restoreTimerRef.current = window.setInterval(() => {
      runRestoreAttempt()
    }, RESTORE_RETRY_DELAY_MS)

    return () => {
      if (restoreTimerRef.current !== null) {
        window.clearInterval(restoreTimerRef.current)
        restoreTimerRef.current = null
      }
    }
  }, [enabled, hasNextPage, isFetchingNextPage, restoreKey])

  useEffect(() => {
    if (!enabled) {
      return
    }

    function scheduleSave() {
      if (restoreControllerRef.current || saveTimerRef.current !== null) {
        return
      }

      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null
        saveScrollPosition()
      }, SAVE_SCROLL_THROTTLE_MS)
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition()
      }
    }

    window.addEventListener('scroll', scheduleSave, { passive: true })
    window.addEventListener('pagehide', saveScrollPosition)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('scroll', scheduleSave)
      window.removeEventListener('pagehide', saveScrollPosition)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
    }
  }, [enabled, restoreKey])
}

function canScrollTo(targetY: number) {
  if (targetY < 0) {
    return false
  }

  const documentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    document.documentElement.offsetHeight,
    document.body.offsetHeight,
  )

  const maxScrollY = Math.max(0, documentHeight - window.innerHeight)

  return maxScrollY >= targetY
}
