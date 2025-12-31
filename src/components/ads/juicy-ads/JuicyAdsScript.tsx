'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

import { JUICY_ADS_EVENT } from '../constants'

declare global {
  interface Window {
    __juicyAdsError?: boolean
    __juicyAdsLoaded?: boolean
    adsbyjuicy?: { adzone: number }[]
  }
}

export default function JuicyAdsScript() {
  const [isInitialized, setIsInitialized] = useState(false)

  // NOTE: Script가 이미 로드된 상태로 이 컴포넌트가 다시 마운트되는 경우(라우트 이동 등) 이벤트를 한 번 더 쏴줘요.
  useEffect(() => {
    if (window.__juicyAdsLoaded) {
      window.dispatchEvent(new Event(JUICY_ADS_EVENT.LOADED))
    }
    if (window.__juicyAdsError) {
      window.dispatchEvent(new Event(JUICY_ADS_EVENT.ERROR))
    }
  }, [])

  useEffect(() => {
    window.adsbyjuicy = window.adsbyjuicy || []
    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return null
  }

  return (
    <>
      <Script
        data-cfasync="false"
        id="juicy-ads"
        onError={() => {
          window.__juicyAdsError = true
          window.dispatchEvent(new Event(JUICY_ADS_EVENT.ERROR))
        }}
        onLoad={() => {
          window.__juicyAdsLoaded = true
          window.dispatchEvent(new Event(JUICY_ADS_EVENT.LOADED))
        }}
        src="https://poweredby.jads.co/js/jads.js"
        strategy="afterInteractive"
      />
    </>
  )
}
