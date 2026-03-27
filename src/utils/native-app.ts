import { Theme } from '@/store/theme'

export type NativeSystemBarsStyle = 'DARK' | 'LIGHT'

export const CAPACITOR_PRIVACY_SCREEN_CONFIG = {
  android: {
    dimBackground: true,
    preventScreenshots: false,
    privacyModeOnActivityHidden: 'dim',
  },
  ios: {
    blurEffect: 'dark',
  },
} as const

export function getNativeSystemBarsStyle(theme: Theme): NativeSystemBarsStyle {
  return theme === Theme.LIGHT ? 'LIGHT' : 'DARK'
}
