'use client'

import { useEffect } from 'react'

const FALLBACK_LIST_PATHNAME = '/new/1'

export default function CapacitorBackButtonHandler() {
  useEffect(() => {
    let cleanup: (() => void) | null = null

    async function setup() {
      const [{ Capacitor }, { App }] = await Promise.all([import('@capacitor/core'), import('@capacitor/app')])

      if (!Capacitor.isNativePlatform()) {
        return
      }

      const listener = await App.addListener('backButton', () => {
        // NOTE:
        // - Rely on JS History API because Next.js navigation uses pushState/replaceState.
        // - WebView.canGoBack() may not reflect SPA navigation reliably.
        if (window.history.length > 1) {
          window.history.back()
          return
        }

        if (window.location.pathname !== FALLBACK_LIST_PATHNAME) {
          window.location.assign(FALLBACK_LIST_PATHNAME)
          return
        }

        App.exitApp()
      })

      cleanup = () => {
        listener.remove()
      }
    }

    void setup()

    return () => {
      cleanup?.()
    }
  }, [])

  return null
}


