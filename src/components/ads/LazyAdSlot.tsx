'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'

import { AD_BLOCK_CHECK_DELAY_MS, JUICY_ADS_SCRIPT_URL } from './constants'

declare global {
  interface Window {
    adsbyjuicy?: { adzone: number }[]
  }
}

type APIError = {
  error: string
  code?: string
  remainingSeconds?: number
}

type EarnResponse = {
  success: boolean
  balance: number
  earned: number
  dailyRemaining: number
}

type Props = {
  zoneId: number
  adSlotId: string
  width: number
  height: number
  className?: string
  rewardEnabled?: boolean
  onAdClick?: (result: { success: boolean; earned?: number; error?: string; requiresLogin?: boolean }) => void
}

type TokenResponse = {
  token: string
  expiresAt: string
  dailyRemaining: number
}

let juicyAdsScriptPromise: Promise<void> | null = null
let isJuicyAdsScriptLoaded = false

export default function LazyAdSlot({
  zoneId,
  adSlotId,
  width,
  height,
  className = '',
  rewardEnabled = true,
  onAdClick,
}: Props) {
  const isHoveringRef = useRef(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isAdBlocked, setIsAdBlocked] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const requestToken = useRequestToken(adSlotId)
  const earnPoints = useEarnPoints()
  const isLoading = requestToken.isPending || earnPoints.isPending
  const apiError = requestToken.error ?? earnPoints.error ?? null
  const canEarn = rewardEnabled && token !== null && !isLoading && !isAdBlocked
  const shouldDimAd = rewardEnabled && !canEarn

  const cooldownRemainingSeconds =
    cooldownUntil !== null ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : (apiError?.remainingSeconds ?? null)

  function handleRefresh() {
    if (!rewardEnabled || isLoading || isAdBlocked) {
      return
    }

    requestToken.mutate(undefined, {
      onSuccess: (data) => {
        setToken(data.token)
        setDailyRemaining(data.dailyRemaining)
        setCooldownUntil(null)
      },
      onError: (err) => {
        setToken(null)
        if (err.remainingSeconds != null) {
          setCooldownUntil(Date.now() + (err.remainingSeconds + 1) * 1000)
        }
      },
    })
  }

  // NOTE: JuicyAds 스크립트가 로드되기 전에 adzone을 등록해야 함
  useEffect(() => {
    window.adsbyjuicy = window.adsbyjuicy || []
    window.adsbyjuicy.push({ adzone: zoneId })
  }, [zoneId])

  // NOTE: JuicyAds 스크립트 로드
  useEffect(() => {
    let isCancelled = false

    loadJuicyAdsScript()
      .then(() => {
        if (!isCancelled) {
          setIsScriptLoaded(true)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsAdBlocked(true)
          setIsScriptLoaded(true)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  // NOTE: 쿨다운 카운트다운 렌더링(1초 간격)
  useEffect(() => {
    if (cooldownUntil === null) {
      return
    }

    const intervalId = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(intervalId)
  }, [cooldownUntil])

  // NOTE: 쿨다운 종료 시 자동으로 토큰 재요청 트리거
  useEffect(() => {
    if (cooldownUntil === null) {
      return
    }

    const delayMs = cooldownUntil - Date.now() + 50
    if (delayMs <= 0) {
      setCooldownUntil(null)
      return
    }

    const timeoutId = setTimeout(() => setCooldownUntil(null), delayMs)
    return () => clearTimeout(timeoutId)
  }, [cooldownUntil])

  // NOTE: 토큰이 없으면(또는 클릭 후 소진되면) 자동으로 토큰을 다시 준비
  useEffect(() => {
    if (!rewardEnabled || isAdBlocked || !isScriptLoaded) {
      return
    }

    if (token !== null) {
      return
    }

    if (cooldownUntil !== null && Date.now() < cooldownUntil) {
      return
    }

    if (requestToken.isPending) {
      return
    }

    requestToken.mutate(undefined, {
      onSuccess: (data) => {
        setToken(data.token)
        setDailyRemaining(data.dailyRemaining)
        setCooldownUntil(null)
      },
      onError: (err) => {
        setToken(null)
        if (err.remainingSeconds != null) {
          setCooldownUntil(Date.now() + (err.remainingSeconds + 1) * 1000)
        }
      },
    })
  }, [rewardEnabled, isAdBlocked, isScriptLoaded, token, cooldownUntil, requestToken])

  // NOTE: 광고 컨텐츠 로드 감지 (MutationObserver)
  useEffect(() => {
    if (!isScriptLoaded || isAdBlocked) {
      return
    }

    const insElement = document.getElementById(String(zoneId))

    if (!insElement) {
      return
    }

    let isMounted = true

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          observer.disconnect()
          return
        }
      }
    })

    observer.observe(insElement, { childList: true, subtree: true })

    // 타임아웃 - 광고가 로드되지 않으면 차단됨
    const timeoutId = setTimeout(() => {
      if (!isMounted) {
        return
      }

      const hasAdContent = insElement.querySelector('iframe, img, a')

      if (!hasAdContent) {
        setIsAdBlocked(true)
        setToken(null)
      }

      observer.disconnect()
    }, AD_BLOCK_CHECK_DELAY_MS)

    return () => {
      isMounted = false
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [isScriptLoaded, isAdBlocked, zoneId])

  // NOTE: window blur 이벤트로 iframe 클릭 감지
  useEffect(() => {
    function handleWindowBlur() {
      if (!isHoveringRef.current || isLoading || isAdBlocked) {
        return
      }

      if (!rewardEnabled) {
        onAdClick?.({ success: false, requiresLogin: true })
        return
      }

      if (!token) {
        return
      }

      earnPoints.mutate(token, {
        onSuccess: (data) => {
          onAdClick?.({ success: true, earned: data.earned })
          setToken(null)
          setDailyRemaining(data.dailyRemaining)
          setCooldownUntil(null)
        },
        onError: (err) => {
          onAdClick?.({ success: false, error: err.error })
          setToken(null)
        },
      })
    }

    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [rewardEnabled, token, isLoading, isAdBlocked, earnPoints, onAdClick])

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ width: `min(${width}px, 100%)`, minHeight: height }}
    >
      {isAdBlocked ? (
        <AdBlockedMessage height={height} width={width} />
      ) : (
        <div className="relative w-full flex flex-col items-center gap-2 z-0">
          <div
            className={`relative cursor-pointer transition-opacity ${shouldDimAd ? 'opacity-60' : 'opacity-100'}`}
            onPointerDown={() => (isHoveringRef.current = true)}
            onPointerEnter={() => (isHoveringRef.current = true)}
            onPointerLeave={() => (isHoveringRef.current = false)}
            style={{ width: `min(${width}px, 100%)`, height }}
          >
            <ins
              data-height={height}
              data-width={width}
              id={String(zoneId)}
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-zinc-900/50 flex items-center justify-center animate-fade-in">
                <div className="size-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {/* CLS 방지: 항상 고정 높이 유지 */}
          <div className="text-xs h-5 flex items-center justify-center">
            {rewardEnabled && apiError ? (
              <div className="text-center">
                <span className="text-amber-500">
                  {apiError.error}
                  {cooldownRemainingSeconds != null && ` (${cooldownRemainingSeconds}초)`}
                </span>
                {!apiError.error.includes('한도') && !apiError.error.includes('잠시 후') && (
                  <button className="ml-2 text-blue-400 hover:underline" disabled={isLoading} onClick={handleRefresh}>
                    다시 시도
                  </button>
                )}
              </div>
            ) : rewardEnabled && dailyRemaining !== null ? (
              dailyRemaining > 0 ? (
                <span className="text-zinc-500">오늘 남은 적립: {dailyRemaining} 리보</span>
              ) : (
                <span className="text-amber-500">오늘의 적립 한도에 도달했어요</span>
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function AdBlockedMessage({ height, width }: { height: number; width: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700 text-center"
      style={{ width: `min(${width}px, 100%)`, minHeight: height }}
    >
      <ShieldOff className="size-8 text-zinc-500" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">광고 차단기가 감지됐어요</p>
        <p className="text-xs text-zinc-500">
          광고 수익은 서버 운영에 사용돼요.
          <br />이 사이트를 화이트리스트에 추가해 주세요.
        </p>
      </div>
      <div className="text-xs text-zinc-600">광고 차단기를 비활성화하면 리보를 적립할 수 있어요</div>
    </div>
  )
}

function loadJuicyAdsScript(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve()
  }

  if (isJuicyAdsScriptLoaded) {
    return Promise.resolve()
  }

  if (juicyAdsScriptPromise) {
    return juicyAdsScriptPromise
  }

  juicyAdsScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${JUICY_ADS_SCRIPT_URL}"]`)

    if (existing instanceof HTMLScriptElement) {
      if (existing.dataset.juicyAdsLoaded === 'true') {
        isJuicyAdsScriptLoaded = true
        resolve()
        return
      }

      existing.addEventListener(
        'load',
        () => {
          existing.dataset.juicyAdsLoaded = 'true'
          isJuicyAdsScriptLoaded = true
          resolve()
        },
        { once: true },
      )

      existing.addEventListener(
        'error',
        () => {
          reject(new Error('JUICY_ADS_SCRIPT_LOAD_FAILED'))
        },
        { once: true },
      )

      return
    }

    const script = document.createElement('script')
    script.src = JUICY_ADS_SCRIPT_URL
    script.async = true
    script.setAttribute('data-cfasync', 'false')

    script.addEventListener(
      'load',
      () => {
        script.dataset.juicyAdsLoaded = 'true'
        isJuicyAdsScriptLoaded = true
        resolve()
      },
      { once: true },
    )

    script.addEventListener(
      'error',
      () => {
        reject(new Error('JUICY_ADS_SCRIPT_LOAD_FAILED'))
      },
      { once: true },
    )

    document.body.appendChild(script)
  })

  juicyAdsScriptPromise.catch(() => {
    juicyAdsScriptPromise = null
  })

  return juicyAdsScriptPromise
}

function useEarnPoints() {
  const queryClient = useQueryClient()

  return useMutation<EarnResponse, APIError, string>({
    mutationFn: async (token) => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw data
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
  })
}

function useRequestToken(adSlotId: string) {
  return useMutation<TokenResponse, APIError>({
    mutationFn: async () => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adSlotId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw data
      }

      return data
    },
  })
}
