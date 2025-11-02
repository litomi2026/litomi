'use client'

import { useEffect } from 'react'

import { Theme, useThemeStore } from '@/store/theme'

export default function ThemeProvider() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const html = document.documentElement

    if (theme === Theme.DARK) {
      html.removeAttribute('data-theme')
    } else {
      html.setAttribute('data-theme', theme)
    }
  }, [theme])

  return null
}
