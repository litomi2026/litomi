'use client'

import { useEffect, useRef, useState } from 'react'

import { ProblemDetailsError } from '@/utils/react-query-error'

import type { AdClickResult } from './types'

import { useCooldown } from './useCooldown'
import { useEarnPointMutation } from './useEarnPointMutation'
import { useRequestTokenMutation } from './useRequestTokenMutation'

type Options = {
  adSlotId: string
  rewardEnabled: boolean
  adReady: boolean
  adBlocked: boolean
  onAdClick?: (result: AdClickResult) => void
}

export function useRewardedAd({ adSlotId, rewardEnabled, adReady, adBlocked, onAdClick }: Options) {
  const requestToken = useRequestTokenMutation(adSlotId)
  const earnPoints = useEarnPointMutation()
  const isHandlingAdClickRef = useRef(false)
  const [token, setToken] = useState<string | null>(null)
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null)
  const isLoading = requestToken.isPending || earnPoints.isPending
  const apiError = requestToken.error ?? earnPoints.error ?? null

  const {
    until: cooldownUntil,
    remainingSeconds: cooldownRemainingSeconds,
    clear: clearCooldown,
    startFromRemainingSeconds,
  } = useCooldown()

  const canEarn = rewardEnabled && adReady && token !== null && !isLoading && !adBlocked
  const shouldDimAd = rewardEnabled && !canEarn

  function refreshToken() {
    if (!rewardEnabled || isLoading || adBlocked || !adReady) {
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
  }

  function handleConfirmedNavigation() {
    if (adBlocked || !adReady) {
      return
    }

    if (!rewardEnabled) {
      onAdClick?.({ success: false })
      return
    }

    if (isHandlingAdClickRef.current || token === null) {
      return
    }

    isHandlingAdClickRef.current = true

    earnPoints.mutate(token, {
      onSuccess: ({ earned, dailyRemaining }) => {
        onAdClick?.({ success: true, earned })
        setToken(null)
        setDailyRemaining(dailyRemaining)
        clearCooldown()
        isHandlingAdClickRef.current = false
      },
      onError: (err) => {
        const message = err instanceof ProblemDetailsError ? err.message : '요청 처리 중 오류가 발생했어요'
        onAdClick?.({ success: false, error: message })
        setToken(null)
        isHandlingAdClickRef.current = false
      },
    })
  }

  // NOTE: 광고가 차단된 상태라면 토큰을 소진(무효화)해요
  useEffect(() => {
    if (adBlocked) {
      setToken(null)
    }
  }, [adBlocked])

  // NOTE: 토큰이 없으면(또는 클릭 후 소진되면) 자동으로 토큰을 다시 준비해요
  useEffect(() => {
    const isAdReady = rewardEnabled && adReady && !adBlocked
    const needsToken = token === null && cooldownUntil === null
    const isRequesting = requestToken.isPending

    if (!isAdReady || !needsToken || isRequesting) {
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
  }, [adBlocked, adReady, clearCooldown, cooldownUntil, requestToken, rewardEnabled, startFromRemainingSeconds, token])

  return {
    token,
    dailyRemaining,
    isLoading,
    apiError,
    canEarn,
    shouldDimAd,
    cooldownUntil,
    cooldownRemainingSeconds,
    refreshToken,
    handleConfirmedNavigation,
  }
}
