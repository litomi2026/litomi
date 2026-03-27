import { describe, expect, it } from 'bun:test'

import { Theme } from '@/store/theme'
import { getNativeSystemBarsStyle } from '@/utils/native-app'

describe('native-app', () => {
  it('라이트 테마에서는 어두운 시스템 바 아이콘을 사용한다', () => {
    expect(getNativeSystemBarsStyle(Theme.LIGHT)).toBe('LIGHT')
  })

  it('어두운 계열 테마에서는 밝은 시스템 바 아이콘을 사용한다', () => {
    expect(getNativeSystemBarsStyle(Theme.DARK)).toBe('DARK')
    expect(getNativeSystemBarsStyle(Theme.NEON)).toBe('DARK')
    expect(getNativeSystemBarsStyle(Theme.RETRO)).toBe('DARK')
  })
})
