'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

import { PLUGRUSH_EVENT } from './constants'

declare global {
  interface Window {
    __plugrushError?: boolean
    __plugrushLoaded?: boolean
    Pub2?: unknown
  }
}

export default function PlugRushScript() {
  const [isInitialized, setIsInitialized] = useState(false)

  // NOTE: Script가 이미 로드된 상태로 이 컴포넌트가 다시 마운트되면 이벤트를 한 번 더 쏴줘요
  useEffect(() => {
    if (window.__plugrushLoaded) {
      window.dispatchEvent(new Event(PLUGRUSH_EVENT.LOADED))
    }
    if (window.__plugrushError) {
      window.dispatchEvent(new Event(PLUGRUSH_EVENT.ERROR))
    }
  }, [])

  useEffect(() => {
    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return null
  }

  return (
    <Script
      id="plugrush-main"
      onError={() => {
        window.__plugrushError = true
        window.dispatchEvent(new Event(PLUGRUSH_EVENT.ERROR))
      }}
      onLoad={() => {
        if (typeof window.Pub2 !== 'function') {
          window.__plugrushError = true
          window.dispatchEvent(new Event(PLUGRUSH_EVENT.ERROR))
          return
        }

        window.__plugrushLoaded = true
        window.dispatchEvent(new Event(PLUGRUSH_EVENT.LOADED))
      }}
      src="/ieuyqwappa.php"
      strategy="afterInteractive"
    />
  )
}
