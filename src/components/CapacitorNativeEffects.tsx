'use client'

import { useEffect } from 'react'

import { useThemeStore } from '@/store/theme'
import { checkCapacitorApp } from '@/utils/browser'
import { CAPACITOR_PRIVACY_SCREEN_CONFIG, getNativeSystemBarsStyle } from '@/utils/native-app'

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

  // NOTE: 앱 전환 시 화면을 가려주는 프라이버시 화면 보호를 적용해요
  useEffect(() => {
    if (!checkCapacitorApp()) {
      return
    }

    let cancelled = false

    async function enablePrivacyScreen() {
      try {
        const { PrivacyScreen } = await import('@capacitor/privacy-screen')

        if (cancelled) {
          return
        }

        await PrivacyScreen.enable(CAPACITOR_PRIVACY_SCREEN_CONFIG)
      } catch (error) {
        console.error('프라이버시 화면 보호 활성화에 실패했어요:', error)
      }
    }

    void enablePrivacyScreen()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
