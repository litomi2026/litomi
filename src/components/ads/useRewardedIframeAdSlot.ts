'use client'

import { useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import type { POSTV1PointTokenResponse } from '@/backend/api/v1/points/token'

import { QueryKeys } from '@/constants/query'
import { useLatestRef } from '@/hook/useLatestRef'
import { ProblemDetailsError } from '@/utils/react-query-error'

import type { AdClickResult } from './types'

import { useCooldown } from './useCooldown'
import { useEarnPointMutation } from './useEarnPointMutation'
import { usePointsTokenQuery } from './usePointsTokenQuery'

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
  const [hasPendingClickOut, setHasPendingClickOut] = useState(false)
  const [isAdReady, setIsAdReady] = useState(false)
  const [isAdBlocked, setIsAdBlocked] = useState(false)
  const isHandlingClaimRef = useRef(false)
  const prevCooldownUntilRef = useRef<number | null>(null)
  const queryClient = useQueryClient()
  const earnPoints = useEarnPointMutation()
  const onResultRef = useLatestRef(onResult)
  const tokenQueryEnabled = rewardEnabled && isAdReady && !isAdBlocked
  const { until: cooldownUntil, clear: clearCooldown, startFromRemainingSeconds } = useCooldown()

  const {
    data: tokenData,
    error: tokenError,
    isFetching: isTokenFetching,
    refetch: refetchToken,
  } = usePointsTokenQuery({ adSlotId, enabled: tokenQueryEnabled })

  const token = tokenQueryEnabled ? (tokenData?.token ? tokenData.token : null) : null
  const dailyRemaining = tokenQueryEnabled ? (tokenData?.dailyRemaining ?? null) : null
  const isLoading = (tokenQueryEnabled && isTokenFetching) || earnPoints.isPending
  const apiError = (tokenQueryEnabled ? tokenError : null) ?? earnPoints.error ?? null
  const tokenRef = useLatestRef(token)
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

  // NOTE: 광고가 차단되면 리워드 상태를 비워요
  useEffect(() => {
    if (isAdBlocked) {
      setHasPendingClickOut(false)
      isHandlingClaimRef.current = false
      clearCooldown()
      queryClient.removeQueries({ queryKey: QueryKeys.pointsToken(adSlotId) })
    }
  }, [adSlotId, clearCooldown, isAdBlocked, queryClient])

  // NOTE: 보상 조건이 꺼지면(로그아웃/검증 만료 등) 리워드 상태를 비워요
  useEffect(() => {
    if (rewardEnabled) {
      return
    }
    clearCooldown()
    setHasPendingClickOut(false)
    isHandlingClaimRef.current = false
    queryClient.removeQueries({ queryKey: QueryKeys.pointsToken(adSlotId) })
  }, [adSlotId, clearCooldown, queryClient, rewardEnabled])

  // ===== Token (slot policy) =====
  const refresh = useCallback(() => {
    if (!tokenQueryEnabled || earnPoints.isPending) {
      return
    }
    clearCooldown()
    refetchToken()
  }, [clearCooldown, earnPoints.isPending, refetchToken, tokenQueryEnabled])

  // NOTE: 429(Retry-After) 응답이면 쿨다운을 시작하고, 종료 시 자동으로 다시 요청해요
  useEffect(() => {
    if (!tokenQueryEnabled) {
      return
    }

    const error = tokenError
    if (!(error instanceof ProblemDetailsError)) {
      return
    }

    const retryAfterSeconds = error.retryAfterSeconds
    if (error.status !== 429 || retryAfterSeconds == null) {
      return
    }

    startFromRemainingSeconds(retryAfterSeconds)
  }, [startFromRemainingSeconds, tokenError, tokenQueryEnabled])

  useEffect(() => {
    const prevCooldownUntil = prevCooldownUntilRef.current
    prevCooldownUntilRef.current = cooldownUntil

    if (!tokenQueryEnabled || isTokenFetching) {
      return
    }

    // NOTE: 쿨다운이 끝난 시점(= until: number -> null)에서만 자동 재요청해요
    if (prevCooldownUntil === null || cooldownUntil !== null) {
      return
    }

    const error = tokenError
    if (!(error instanceof ProblemDetailsError)) {
      return
    }

    const retryAfterSeconds = error.retryAfterSeconds
    if (error.status !== 429 || retryAfterSeconds == null) {
      return
    }

    refetchToken()
  }, [cooldownUntil, isTokenFetching, refetchToken, tokenError, tokenQueryEnabled])

  // NOTE: 토큰이 준비되면 쿨다운(에러 상태)을 해제해요
  useEffect(() => {
    if (!tokenQueryEnabled) {
      return
    }
    if (tokenData?.token) {
      clearCooldown()
    }
  }, [clearCooldown, tokenData, tokenQueryEnabled])

  // NOTE: 토큰이 만료되기 전에 자동으로 새 토큰을 준비해요
  useEffect(() => {
    if (!tokenQueryEnabled) {
      return
    }

    const expiresAt = tokenData?.expiresAt
    if (!expiresAt) {
      return
    }

    const expiresAtMs = Date.parse(expiresAt)
    if (!Number.isFinite(expiresAtMs)) {
      return
    }

    const REFRESH_FUDGE_MS = ms('5 seconds')
    const delayMs = Math.max(0, expiresAtMs - Date.now() - REFRESH_FUDGE_MS)

    const timeoutId = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsToken(adSlotId) })
    }, delayMs)

    return () => clearTimeout(timeoutId)
  }, [adSlotId, queryClient, tokenData?.expiresAt, tokenQueryEnabled])

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

    function handleWindowBlur() {
      const armedUntil = armedUntilRef.current
      if (armedUntil === null) {
        return
      }

      const nowMs = Date.now()
      if (nowMs > armedUntil) {
        disarm()
        return
      }

      const active = document.activeElement
      const activeIsIframe = active instanceof HTMLIFrameElement
      const activeInsideContainer = active instanceof Element ? safeContainer.contains(active) : false

      // NOTE: 일부 브라우저/광고는 새 창(팝업)으로 열리면서 visibilitychange(hidden)가 발생하지 않을 수 있어요.
      // 이 경우 window.blur + activeElement=iframe(슬롯 내부)로 클릭아웃을 확인해요.
      if (!activeIsIframe || !activeInsideContainer) {
        return
      }

      disarm()

      if (!rewardEnabled) {
        onResultRef.current?.({ success: false })
        return
      }

      if (tokenRef.current === null) {
        return
      }

      if (isHandlingClaimRef.current || hasPendingClickOut) {
        return
      }

      setHasPendingClickOut(true)
    }

    function disarm() {
      armedUntilRef.current = null
      if (armTimeoutId) {
        clearTimeout(armTimeoutId)
        armTimeoutId = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
    }

    function arm(nowMs: number) {
      disarm()
      armedUntilRef.current = nowMs + confirmWindowMs
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('blur', handleWindowBlur)
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

      if (tokenRef.current === null) {
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

    function handleFallbackBlur() {
      // NOTE: 일부 환경에서는 iframe 내부 클릭이 부모 문서의 pointerdown/focus로 잡히지 않고,
      // visibilitychange(hidden)도 안 오는데 window.blur만 발생해요.
      // 이 경우를 위해 "비-armed" 상태에서도(=Attempt 신호 없음) blur+activeElement=iframe이면 click-out으로 인정해요.
      // 단, visibilityState가 visible인 경우에만(=alt-tab류 오탐 감소) 처리해요.
      if (armedUntilRef.current !== null) {
        return
      }
      if (document.visibilityState !== 'visible') {
        return
      }

      const active = document.activeElement
      const activeIsIframe = active instanceof HTMLIFrameElement
      const activeInsideContainer = active instanceof Element ? safeContainer.contains(active) : false

      if (!activeIsIframe || !activeInsideContainer) {
        return
      }

      if (!rewardEnabled) {
        onResultRef.current?.({ success: false })
        return
      }
      if (tokenRef.current === null) {
        return
      }
      if (isHandlingClaimRef.current || hasPendingClickOut) {
        return
      }

      setHasPendingClickOut(true)
    }

    safeContainer.addEventListener('focus', handleSlotFocus, true)
    safeContainer.addEventListener('pointerdown', handlePointerDownEvent, true)
    window.addEventListener('blur', handleFallbackBlur)

    return () => {
      safeContainer.removeEventListener('focus', handleSlotFocus, true)
      safeContainer.removeEventListener('pointerdown', handlePointerDownEvent, true)
      window.removeEventListener('blur', handleFallbackBlur)
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
    tokenRef,
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
      if (!document.hasFocus()) {
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
          clearCooldown()
          queryClient.setQueryData<POSTV1PointTokenResponse>(QueryKeys.pointsToken(adSlotId), (prev) => {
            return prev ? { ...prev, token: '', dailyRemaining } : prev
          })
          if (tokenQueryEnabled) {
            refetchToken()
          }
          isHandlingClaimRef.current = false
        },
        onError: (err) => {
          onResultRef.current?.({ success: false })
          if (err instanceof ProblemDetailsError && err.retryAfterSeconds != null) {
            startFromRemainingSeconds(err.retryAfterSeconds)
          }
          queryClient.setQueryData<POSTV1PointTokenResponse>(QueryKeys.pointsToken(adSlotId), (prev) => {
            return prev ? { ...prev, token: '' } : prev
          })
          if (tokenQueryEnabled) {
            refetchToken()
          }
          isHandlingClaimRef.current = false
        },
      })
    }

    tryClaim()

    function handleVisibilityChange() {
      tryClaim()
    }

    function handleWindowFocus() {
      tryClaim()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [
    clearCooldown,
    earnPoints,
    hasPendingClickOut,
    isAdBlocked,
    isAdReady,
    isLoading,
    onResultRef,
    queryClient,
    refetchToken,
    rewardEnabled,
    startFromRemainingSeconds,
    token,
    tokenQueryEnabled,
    adSlotId,
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
