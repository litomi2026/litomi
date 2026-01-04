'use client'

import { useEffect, useRef, useState } from 'react'

import { formatDistanceFromNow } from '@/utils/format/date'

import type { AdClickResult } from '../types'

import AdBlockedMessage from '../AdBlockedMessage'
import RewardedAdFooter from '../RewardedAdFooter'
import { useRewardedIframeAdSlot } from '../useRewardedIframeAdSlot'
import { JUICY_ADS_EVENT } from './constants'

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
  onAdClick?: (result: AdClickResult) => void
}

export default function JuicyAdsSlot({
  zoneId,
  adSlotId,
  width,
  height,
  className = '',
  rewardEnabled = true,
  onAdClick,
}: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isScriptError, setIsScriptError] = useState(false)

  const { dailyRemaining, isLoading, apiError, shouldDimAd, cooldownUntil, refresh, isAdBlocked } =
    useRewardedIframeAdSlot({
      adSlotId,
      rewardEnabled,
      scriptLoaded: isScriptLoaded,
      scriptFailed: isScriptError,
      containerRef: slotRef,
      onResult: onAdClick,
    })

  const cooldownLabel = cooldownUntil ? formatDistanceFromNow(new Date(cooldownUntil)) : null

  // NOTE: JuicyAds 스크립트가 로드되기 전에 adzone을 등록해야 함
  useEffect(() => {
    window.adsbyjuicy = window.adsbyjuicy || []
    // NOTE: 탭 전환 등으로 슬롯이 재마운트되면, JuicyAds는 "push"를 트리거로 다시 렌더링하는 경우가 있어요.
    // push를 막으면 새로 생긴 <ins id={zoneId}>에 광고가 표시되지 않을 수 있어요.
    window.adsbyjuicy.push({ adzone: zoneId })

    // NOTE: 배열 객체는 유지하면서(=push가 스크립트에 의해 패치됐을 수 있음) 길이만 제한해요.
    const MAX_QUEUE_SIZE = 50
    if (window.adsbyjuicy.length > MAX_QUEUE_SIZE) {
      window.adsbyjuicy.splice(0, window.adsbyjuicy.length - MAX_QUEUE_SIZE)
    }
  }, [zoneId])

  // NOTE: JuicyAds 스크립트 로드 상태 구독
  useEffect(() => {
    if (window.__juicyAdsError) {
      setIsScriptError(true)
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
      setIsScriptError(true)
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
    if (!isScriptLoaded || isScriptError) {
      return
    }

    // NOTE: jads.js 는 로드 시점에만 GA(...)를 한 번 돌려요.
    // SPA(탭/페이지 전환)에서 새로 생긴 슬롯(<ins id={zoneId}>)은 자동으로 채워지지 않아서,
    // 슬롯 마운트 시점에 GA(또는 Fe)를 다시 호출해줘야 해요.
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
  }, [isScriptLoaded, isScriptError, zoneId])

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ width: `min(${width}px, 100%)`, minHeight: height }}
      title={`zoneId: ${zoneId}, adSlotId: ${adSlotId}`}
    >
      {isAdBlocked ? (
        <AdBlockedMessage height={height} width={width} />
      ) : (
        <div
          aria-disabled={shouldDimAd}
          className="relative cursor-pointer z-0 rounded-xl border overflow-hidden bg-white/4 border-white/7 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          ref={slotRef}
          style={{ width: `min(${width}px, 100%)`, height }}
        >
          <ins className="block w-full h-full" data-height={height} data-width={width} id={String(zoneId)} />
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-950/40 flex items-center justify-center">
              <span className="text-xs font-medium text-zinc-200">불러오는 중이에요…</span>
            </div>
          )}
        </div>
      )}
      <RewardedAdFooter
        apiError={apiError}
        cooldownLabel={cooldownLabel}
        dailyRemaining={dailyRemaining}
        isLoading={isLoading}
        onRetry={refresh}
        rewardEnabled={rewardEnabled}
      />
    </div>
  )
}
