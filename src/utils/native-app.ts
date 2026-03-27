import { Theme } from '@/store/theme'

export type NativeSystemBarsStyle = 'DARK' | 'LIGHT'

export function getNativeSystemBarsStyle(theme: Theme): NativeSystemBarsStyle {
  return theme === Theme.LIGHT ? 'LIGHT' : 'DARK'
}
