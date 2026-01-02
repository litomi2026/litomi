'use client'

import ms from 'ms'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { useLatestRef } from '@/hook/useLatestRef'
import { ProblemDetailsError } from '@/utils/react-query-error'

import type { AdClickResult } from './types'

import { useCooldown } from './useCooldown'
import { useEarnPointMutation } from './useEarnPointMutation'
import { useRequestTokenMutation } from './useRequestTokenMutation'

type Options = {
  adSlotId: string
  rewardEnabled: boolean
  scriptLoaded: boolean
  scriptFailed?: boolean
  containerRef: RefObject<HTMLElement | null>
  onResult?: (result: AdClickResult) => void

  loadTimeoutMs?: number
  confirmWindowMs?: number
  pointerFocusWindowMs?: number
}

type Return = {
  isAdBlocked: boolean
  isAdReady: boolean

  dailyRemaining: number | null
  isLoading: boolean
  apiError: unknown | null
  shouldDimAd: boolean
  cooldownUntil: number | null

  refresh: () => void
}

const DEFAULT_LOAD_TIMEOUT_MS = ms('10 seconds')
const DEFAULT_CONFIRM_WINDOW_MS = ms('500ms')
const DEFAULT_POINTER_FOCUS_WINDOW_MS = ms('200ms')

export function useRewardedIframeAdSlot({
  adSlotId,
  rewardEnabled,
  scriptLoaded,
  scriptFailed = false,
  containerRef,
  onResult,
  loadTimeoutMs = DEFAULT_LOAD_TIMEOUT_MS,
  confirmWindowMs = DEFAULT_CONFIRM_WINDOW_MS,
  pointerFocusWindowMs = DEFAULT_POINTER_FOCUS_WINDOW_MS,
}: Options): Return {
  const requestToken = useRequestTokenMutation(adSlotId)
  const earnPoints = useEarnPointMutation()
  const isHandlingClaimRef = useRef(false)
  const [hasPendingClickOut, setHasPendingClickOut] = useState(false)

  const [isAdReady, setIsAdReady] = useState(false)
  const [isAdBlocked, setIsAdBlocked] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null)

  const isLoading = requestToken.isPending || earnPoints.isPending
  const apiError = requestToken.error ?? earnPoints.error ?? null
  const onResultRef = useLatestRef(onResult)

  const { until: cooldownUntil, clear: clearCooldown, startFromRemainingSeconds } = useCooldown()

  const canEarn = rewardEnabled && isAdReady && token !== null && !isLoading && !isAdBlocked
  const shouldDimAd = rewardEnabled && !canEarn

  // ===== Load (iframe readiness / blocked) =====
  useEffect(() => {
    if (scriptFailed) {
      setIsAdBlocked(true)
      return
    }
    if (!scriptLoaded) {
      return
    }
    if (isAdBlocked) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const safeContainer: HTMLElement = container

    function hasIframe() {
      return Boolean(safeContainer.querySelector('iframe'))
    }

    if (hasIframe()) {
      setIsAdReady(true)
      return
    }

    let isMounted = true

    const observer = new MutationObserver(() => {
      if (!isMounted) {
        return
      }
      if (hasIframe()) {
        observer.disconnect()
        setIsAdReady(true)
      }
    })

    observer.observe(safeContainer, { childList: true, subtree: true })

    const timeoutId = setTimeout(() => {
      if (!isMounted) {
        return
      }

      if (!hasIframe()) {
        setIsAdBlocked(true)
      }

      observer.disconnect()
    }, loadTimeoutMs)

    return () => {
      isMounted = false
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [containerRef, isAdBlocked, loadTimeoutMs, scriptFailed, scriptLoaded])

  // NOTE: 광고가 차단되면 토큰을 소진(무효화)해요
  useEffect(() => {
    if (isAdBlocked) {
      setToken(null)
      setHasPendingClickOut(false)
      isHandlingClaimRef.current = false
    }
  }, [isAdBlocked])

  // NOTE: 보상 조건이 꺼지면(로그아웃/검증 만료 등) 리워드 상태를 비워요
  useEffect(() => {
    if (rewardEnabled) {
      return
    }
    setToken(null)
    setDailyRemaining(null)
    clearCooldown()
    setHasPendingClickOut(false)
    isHandlingClaimRef.current = false
  }, [clearCooldown, rewardEnabled])

  // ===== Token (slot policy) =====
  const refresh = useCallback(() => {
    if (!rewardEnabled || isLoading || isAdBlocked || !isAdReady) {
      return
    }

    requestToken.mutate(undefined, {
      onSuccess: (data) => {
        setToken(data.token)
        setDailyRemaining(data.dailyRemaining)
        clearCooldown()
      },
      onError: (err) => {
        setToken(null)
        if (err instanceof ProblemDetailsError && err.retryAfterSeconds != null) {
          startFromRemainingSeconds(err.retryAfterSeconds)
        }
      },
    })
  }, [clearCooldown, isAdBlocked, isAdReady, isLoading, requestToken, rewardEnabled, startFromRemainingSeconds])

  // NOTE: 토큰이 없으면(또는 클릭 후 소진되면) 자동으로 토큰을 다시 준비해요
  useEffect(() => {
    const isReadyForToken = rewardEnabled && isAdReady && !isAdBlocked
    const needsToken = token === null && cooldownUntil === null
    const isRequesting = requestToken.isPending

    if (!isReadyForToken || !needsToken || isRequesting) {
      return
    }

    requestToken.mutate(undefined, {
      onSuccess: ({ token, dailyRemaining }) => {
        setToken(token)
        setDailyRemaining(dailyRemaining)
        clearCooldown()
      },
      onError: (err) => {
        setToken(null)
        if (err instanceof ProblemDetailsError && err.retryAfterSeconds != null) {
          startFromRemainingSeconds(err.retryAfterSeconds)
        }
      },
    })
  }, [
    clearCooldown,
    cooldownUntil,
    isAdBlocked,
    isAdReady,
    requestToken,
    rewardEnabled,
    startFromRemainingSeconds,
    token,
  ])

  // ===== Click-out detection (Attempt → Arm → Confirm) =====
  useEffect(() => {
    if (!scriptLoaded || isAdBlocked || !isAdReady) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    const safeContainer: HTMLElement = container
    const lastPointerDownAtRef = { current: null as number | null }
    const armedUntilRef = { current: null as number | null }
    let armTimeoutId: ReturnType<typeof setTimeout> | null = null

    function disarm() {
      armedUntilRef.current = null
      if (armTimeoutId) {
        clearTimeout(armTimeoutId)
        armTimeoutId = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }

    function arm(nowMs: number) {
      disarm()
      armedUntilRef.current = nowMs + confirmWindowMs
      document.addEventListener('visibilitychange', handleVisibilityChange)
      armTimeoutId = setTimeout(disarm, confirmWindowMs)
    }

    function handlePointerDown(target: EventTarget | null) {
      if (!(target instanceof HTMLIFrameElement)) {
        return
      }
      if (!safeContainer.contains(target)) {
        return
      }
      lastPointerDownAtRef.current = Date.now()
    }

    function handleSlotFocus(event: FocusEvent) {
      if (!(event.target instanceof HTMLIFrameElement)) {
        return
      }
      if (!safeContainer.contains(event.target)) {
        return
      }

      const nowMs = Date.now()
      const pointerDownAt = lastPointerDownAtRef.current

      if (pointerDownAt === null || nowMs - pointerDownAt > pointerFocusWindowMs) {
        return
      }

      lastPointerDownAtRef.current = null
      arm(nowMs)
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== 'hidden') {
        return
      }

      const armedUntil = armedUntilRef.current
      if (armedUntil === null) {
        return
      }

      const nowMs = Date.now()
      if (nowMs > armedUntil) {
        disarm()
        return
      }

      disarm()

      if (!rewardEnabled) {
        onResultRef.current?.({ success: false })
        return
      }

      if (isHandlingClaimRef.current || hasPendingClickOut) {
        return
      }

      setHasPendingClickOut(true)
    }

    function handlePointerDownEvent(event: PointerEvent) {
      handlePointerDown(event.target)
    }

    safeContainer.addEventListener('focus', handleSlotFocus, true)
    safeContainer.addEventListener('pointerdown', handlePointerDownEvent, true)

    return () => {
      safeContainer.removeEventListener('focus', handleSlotFocus, true)
      safeContainer.removeEventListener('pointerdown', handlePointerDownEvent, true)
      disarm()
    }
  }, [
    confirmWindowMs,
    containerRef,
    hasPendingClickOut,
    isAdBlocked,
    isAdReady,
    onResultRef,
    pointerFocusWindowMs,
    rewardEnabled,
    scriptLoaded,
  ])

  // ===== Claim (on return) =====
  useEffect(() => {
    if (!hasPendingClickOut) {
      return
    }

    function tryClaim() {
      if (!hasPendingClickOut) {
        return
      }
      if (document.visibilityState !== 'visible') {
        return
      }
      if (!rewardEnabled || isAdBlocked || !isAdReady) {
        setHasPendingClickOut(false)
        return
      }
      if (isHandlingClaimRef.current || isLoading || token === null) {
        return
      }

      isHandlingClaimRef.current = true
      setHasPendingClickOut(false)

      earnPoints.mutate(token, {
        onSuccess: ({ earned, dailyRemaining }) => {
          onResultRef.current?.({ success: true, earned })
          setToken(null)
          setDailyRemaining(dailyRemaining)
          clearCooldown()
          isHandlingClaimRef.current = false
        },
        onError: (err) => {
          onResultRef.current?.({ success: false })
          setToken(null)
          if (err instanceof ProblemDetailsError && err.retryAfterSeconds != null) {
            startFromRemainingSeconds(err.retryAfterSeconds)
          }
          isHandlingClaimRef.current = false
        },
      })
    }

    tryClaim()

    function handleVisibilityChange() {
      tryClaim()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [
    clearCooldown,
    earnPoints,
    hasPendingClickOut,
    isAdBlocked,
    isAdReady,
    isLoading,
    onResultRef,
    rewardEnabled,
    startFromRemainingSeconds,
    token,
  ])

  return {
    isAdBlocked,
    isAdReady,
    dailyRemaining,
    isLoading,
    apiError,
    shouldDimAd,
    cooldownUntil,
    refresh,
  }
}
