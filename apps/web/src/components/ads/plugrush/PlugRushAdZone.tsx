'use client'

import { useEffect, useRef } from 'react'

import { PLUGRUSH_EVENT } from './constants'

type Props = {
  zoneElementId: `_26${string}`
  className?: string
  slotClassName?: string
}

declare global {
  interface Window {
    __plugrushError?: boolean
    __plugrushInitScheduled?: boolean
    __plugrushLoaded?: boolean
    pub?: unknown
    Pub2?: unknown
  }
}

export default function PlugRushAdZone({ zoneElementId, className = '', slotClassName }: Props) {
  const slotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const slot = slotRef.current
    if (!slot) {
      return
    }

    // NOTE: React가 id를 되돌리지 않게 DOM을 직접 생성해서 제어권을 넘겨요
    slot.innerHTML = ''

    const zone = document.createElement('div')
    zone.id = zoneElementId
    zone.className = `_fa6a8f ${className}`.trim()
    slot.appendChild(zone)

    function handleLoaded() {
      requestPlugRushInit()
    }

    window.addEventListener(PLUGRUSH_EVENT.LOADED, handleLoaded)

    // NOTE: 스크립트가 먼저 로드된 경우에도 슬롯 마운트 시 즉시 재시도해요.
    if (window.__plugrushLoaded) {
      handleLoaded()
    } else {
      requestPlugRushInit()
    }

    return () => {
      window.removeEventListener(PLUGRUSH_EVENT.LOADED, handleLoaded)
      slot.innerHTML = ''
    }
  }, [className, zoneElementId])

  return <div className={slotClassName} ref={slotRef} />
}

function requestPlugRushInit() {
  if (typeof window === 'undefined') {
    return
  }

  if (window.__plugrushInitScheduled) {
    return
  }

  window.__plugrushInitScheduled = true

  setTimeout(() => {
    window.__plugrushInitScheduled = false

    if (typeof window.Pub2 !== 'function') {
      return
    }

    try {
      // NOTE: Pub2는 readyCheck로 1회만 생성되지만, SPA에서 adzone이 나중에 생길 수 있어서
      // 새 인스턴스를 만들어 한 번 더 스캔해요.
      const Pub2Constructor = window.Pub2 as unknown as new () => unknown
      window.pub = new Pub2Constructor()
    } catch {
      // ignore
    }
  }, 0)
}
