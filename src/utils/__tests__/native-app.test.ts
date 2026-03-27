import { describe, expect, it } from 'bun:test'

import { Theme } from '@/store/theme'
import { CAPACITOR_PRIVACY_SCREEN_CONFIG, getNativeSystemBarsStyle } from '@/utils/native-app'

describe('native-app', () => {
  it('라이트 테마에서는 어두운 시스템 바 아이콘을 사용한다', () => {
    expect(getNativeSystemBarsStyle(Theme.LIGHT)).toBe('LIGHT')
  })

  it('어두운 계열 테마에서는 밝은 시스템 바 아이콘을 사용한다', () => {
    expect(getNativeSystemBarsStyle(Theme.DARK)).toBe('DARK')
    expect(getNativeSystemBarsStyle(Theme.NEON)).toBe('DARK')
    expect(getNativeSystemBarsStyle(Theme.RETRO)).toBe('DARK')
  })

  it('최근 앱 화면 보호는 유지하면서 스크린샷은 허용한다', () => {
    expect(CAPACITOR_PRIVACY_SCREEN_CONFIG.android.dimBackground).toBe(true)
    expect(CAPACITOR_PRIVACY_SCREEN_CONFIG.android.preventScreenshots).toBe(false)
    expect(CAPACITOR_PRIVACY_SCREEN_CONFIG.android.privacyModeOnActivityHidden).toBe('dim')
    expect(CAPACITOR_PRIVACY_SCREEN_CONFIG.ios.blurEffect).toBe('dark')
  })
})
