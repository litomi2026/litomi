'use client'

import { useEffect, useRef, useState } from 'react'

import { formatDistanceFromNow } from '@/utils/format/date'

import type { AdClickResult } from '../types'

import AdBlockedMessage from '../AdBlockedMessage'
import AdPlaceholder from '../AdPlaceholder'
import RewardedAdFooter from '../RewardedAdFooter'
import { useRewardedIframeAdSlot } from '../useRewardedIframeAdSlot'

type AtOptions = {
  key: string
  format: 'iframe'
  height: number
  width: number
  params: Record<string, unknown>
}

declare global {
  interface Window {
    atOptions?: AtOptions
  }
}

const AD_KEY = '8c8e37cddd2122c156a0d2d9cad67d96'
const AD_WIDTH = 300
const AD_HEIGHT = 250

type Props = {
  adSlotId: string
  className?: string
  rewardEnabled?: boolean
  onAdClick?: (result: AdClickResult) => void
}

export default function AdsterraBanner300x250({ adSlotId, className = '', rewardEnabled = false, onAdClick }: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isScriptError, setIsScriptError] = useState(false)

  const { dailyRemaining, isLoading, apiError, shouldDimAd, cooldownUntil, refresh, isAdBlocked, isAdReady } =
    useRewardedIframeAdSlot({
      adSlotId,
      rewardEnabled,
      scriptLoaded: isScriptLoaded,
      scriptFailed: isScriptError,
      containerRef: slotRef,
      onResult: onAdClick,
    })

  const cooldownLabel = cooldownUntil ? formatDistanceFromNow(new Date(cooldownUntil)) : null

  // NOTE: 광고 불러오기
  useEffect(() => {
    const slot = slotRef.current
    if (!slot) {
      return
    }

    let isMounted = true
    setIsScriptLoaded(false)
    setIsScriptError(false)

    // NOTE: 재마운트/재시도 시 중복 생성 방지
    slot.innerHTML = ''

    window.atOptions = {
      key: AD_KEY,
      format: 'iframe',
      height: AD_HEIGHT,
      width: AD_WIDTH,
      params: {},
    }

    const script = document.createElement('script')
    script.src = `https://www.highperformanceformat.com/${AD_KEY}/invoke.js`
    script.async = false
    script.addEventListener('load', () => {
      if (isMounted) {
        setIsScriptLoaded(true)
      }
    })
    script.addEventListener('error', () => {
      if (isMounted) {
        setIsScriptError(true)
        setIsScriptLoaded(true)
      }
    })
    slot.appendChild(script)

    return () => {
      isMounted = false
      slot.innerHTML = ''
    }
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      style={{ width: `min(${AD_WIDTH}px, 100%)`, minHeight: AD_HEIGHT }}
      title={`adSlotId: ${adSlotId}`}
    >
      {isAdBlocked ? (
        <AdBlockedMessage height={AD_HEIGHT} width={AD_WIDTH} />
      ) : (
        <div
          aria-disabled={shouldDimAd}
          className="relative cursor-pointer z-0 rounded-xl border overflow-hidden bg-white/4 border-white/7 aria-disabled:opacity-60 aria-disabled:cursor-not-allowed"
          style={{ width: `min(${AD_WIDTH}px, 100%)`, height: AD_HEIGHT }}
        >
          {!isAdReady && <AdPlaceholder className="rounded-none" height={AD_HEIGHT} width={AD_WIDTH} />}
          <div className="absolute inset-0" ref={slotRef} />
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
