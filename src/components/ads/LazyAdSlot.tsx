'use client'

import { ShieldOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AD_BLOCK_CHECK_DELAY_MS, JUICY_ADS_EVENT } from './constants'
import { useCooldown } from './useCooldown'
import { useEarnPoints } from './useEarnPoints'
import { useRequestToken } from './useRequestToken'

declare global {
  interface Window {
    __juicyAdsError?: boolean
    __juicyAdsLoaded?: boolean
    adsbyjuicy?: { adzone: number }[]

    // NOTE: JuicyAds 스크립트( jads.js )가 전역에 노출하는 함수들 (non-strict global assignment)
    Fe?: () => void
    GA?: (queue: unknown) => void
  }
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
  const slotRef = useRef<HTMLDivElement>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isAdBlocked, setIsAdBlocked] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [dailyRemaining, setDailyRemaining] = useState<number | null>(null)
  const requestToken = useRequestToken(adSlotId)
  const earnPoints = useEarnPoints()
  const isLoading = requestToken.isPending || earnPoints.isPending
  const apiError = requestToken.error ?? earnPoints.error ?? null
  const canEarn = rewardEnabled && token !== null && !isLoading && !isAdBlocked
  const shouldDimAd = rewardEnabled && !canEarn

  const {
    until: cooldownUntil,
    remainingSeconds: cooldownSecondsFromHook,
    clear: clearCooldown,
    startFromRemainingSeconds,
  } = useCooldown()

  const cooldownRemainingSeconds = cooldownSecondsFromHook ?? apiError?.remainingSeconds ?? null

  function handleRefresh() {
    if (!rewardEnabled || isLoading || isAdBlocked) {
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
        if (err.remainingSeconds != null) {
          startFromRemainingSeconds(err.remainingSeconds)
        }
      },
    })
  }

  // NOTE: JuicyAds 스크립트가 로드되기 전에 adzone을 등록해야 함
  useEffect(() => {
    window.adsbyjuicy = window.adsbyjuicy || []
    // NOTE: 탭 전환 등으로 슬롯이 재마운트되면, JuicyAds는 "push"를 트리거로 다시 렌더링하는 경우가 있어요.
    // 중복 방지로 push를 막으면 새로 생긴 <ins id={zoneId}>에 광고가 안 뜨고, 아래의 "차단기 감지" 타임아웃이 오탐을 만들 수 있어요.
    window.adsbyjuicy.push({ adzone: zoneId })

    // NOTE: 배열 객체는 유지하면서(=push가 스크립트에 의해 패치됐을 수 있음), 길이만 제한해요.
    const MAX_QUEUE_SIZE = 50
    if (window.adsbyjuicy.length > MAX_QUEUE_SIZE) {
      window.adsbyjuicy.splice(0, window.adsbyjuicy.length - MAX_QUEUE_SIZE)
    }
  }, [zoneId])

  // NOTE: JuicyAds 스크립트 로드 상태 구독(상위에서 <Script> 1회 로드)
  useEffect(() => {
    if (window.__juicyAdsError) {
      setIsAdBlocked(true)
      setIsScriptLoaded(true)
      return
    }

    if (window.__juicyAdsLoaded) {
      setIsScriptLoaded(true)
      return
    }

    function handleLoaded() {
      setIsScriptLoaded(true)
    }

    function handleError() {
      setIsAdBlocked(true)
      setIsScriptLoaded(true)
    }

    window.addEventListener(JUICY_ADS_EVENT.LOADED, handleLoaded)
    window.addEventListener(JUICY_ADS_EVENT.ERROR, handleError)

    return () => {
      window.removeEventListener(JUICY_ADS_EVENT.LOADED, handleLoaded)
      window.removeEventListener(JUICY_ADS_EVENT.ERROR, handleError)
    }
  }, [])

  // NOTE: 스크립트가 준비되면, 현재 슬롯을 다시 채우도록 jads.js의 GA(...)를 호출
  useEffect(() => {
    if (!isScriptLoaded || isAdBlocked) {
      return
    }

    // NOTE: jads.js 는 로드 시점에만 GA(...)를 한 번 돌려요.
    // SPA(탭/페이지 전환)에서 새로 생긴 슬롯(<ins id={zoneId}>)은 자동으로 채워지지 않아서,
    // 슬롯 마운트 시점에 GA(adsbyjuicy)를 다시 호출해줘야 해요.
    try {
      if (typeof window.GA === 'function') {
        window.GA(window.adsbyjuicy ?? [])
        return
      }
      if (typeof window.Fe === 'function') {
        window.Fe()
      }
    } catch {
      // ignore
    }
  }, [isScriptLoaded, zoneId, isAdBlocked])

  // NOTE: 토큰이 없으면(또는 클릭 후 소진되면) 자동으로 토큰을 다시 준비
  useEffect(() => {
    if (!rewardEnabled || isAdBlocked || !isScriptLoaded) {
      return
    }

    if (token !== null) {
      return
    }

    if (cooldownUntil !== null) {
      return
    }

    if (requestToken.isPending) {
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
        if (err.remainingSeconds != null) {
          startFromRemainingSeconds(err.remainingSeconds)
        }
      },
    })
  }, [
    rewardEnabled,
    isAdBlocked,
    isScriptLoaded,
    token,
    cooldownUntil,
    requestToken,
    clearCooldown,
    startFromRemainingSeconds,
  ])

  // NOTE: 광고 컨텐츠 로드 감지 (MutationObserver)
  useEffect(() => {
    const slotElement = slotRef.current

    if (!isScriptLoaded || isAdBlocked || !slotElement) {
      return
    }

    let isMounted = true

    const observer = new MutationObserver(() => {
      // jads.js 는 <ins>를 <iframe>로 "교체"해요. (ins 내부가 아니라 slot 컨테이너에 iframe이 생김)
      const hasIframe = Boolean(slotElement.querySelector('iframe'))
      if (hasIframe) {
        observer.disconnect()
      }
    })

    observer.observe(slotElement, { childList: true, subtree: true })

    // 타임아웃 - 광고가 로드되지 않으면 차단됨
    const timeoutId = setTimeout(() => {
      if (!isMounted) {
        return
      }

      const hasIframe = Boolean(slotElement.querySelector('iframe'))

      if (!hasIframe) {
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
          clearCooldown()
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
  }, [rewardEnabled, token, isLoading, isAdBlocked, earnPoints, onAdClick, clearCooldown])

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
            ref={slotRef}
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
        <p className="text-sm font-medium text-zinc-300">광고가 차단되고 있어요</p>
        <p className="text-xs text-zinc-500">
          광고 수익은 서버 운영과 작가 후원에 사용돼요.
          <br />이 사이트를 화이트리스트에 추가해 주시면 큰 도움이 돼요.
        </p>
      </div>
      <div className="text-xs text-zinc-600">광고가 보이면 클릭해서 리보를 적립할 수 있어요</div>
    </div>
  )
}
