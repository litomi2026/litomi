'use client'

import { useEffect } from 'react'

import { useThemeStore } from '@/store/theme'
import { checkCapacitorApp } from '@/utils/browser'
import { getNativeSystemBarsStyle } from '@/utils/native-app'

export default function CapacitorNativeEffects() {
  const theme = useThemeStore((state) => state.theme)

  // NOTE: 시스템 바 스타일을 적용해요
  useEffect(() => {
    if (!checkCapacitorApp()) {
      return
    }

    let cancelled = false

    async function syncSystemBars() {
      try {
        const { SystemBars, SystemBarsStyle } = await import('@capacitor/core')

        if (cancelled) {
          return
        }

        const style = getNativeSystemBarsStyle(theme) === 'LIGHT' ? SystemBarsStyle.Light : SystemBarsStyle.Dark
        await SystemBars.setStyle({ style })
      } catch (error) {
        console.error('시스템 바 스타일 적용에 실패했어요:', error)
      }
    }

    void syncSystemBars()

    return () => {
      cancelled = true
    }
  }, [theme])
  return null
}
