'use client'

import { useEffect, useState } from 'react'

declare global {
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    prompt(): Promise<void>
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed'
      platform: string
    }>
  }
}

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent>()

  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window))
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isLegacyStandalone = 'standalone' in window.navigator && window.navigator.standalone === true
    setIsStandalone(isStandalone || isLegacyStandalone)
  }, [])

  useEffect(() => {
    // beforeinstallprompt 이벤트 리스너 등록 (안드로이드, 데스크탑 등)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleAddToHomeScreen = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`사용자 응답: ${outcome}`)
      // 프롬프트는 한 번 사용하면 다시 생성되지 않으므로 상태를 리셋합니다.
      setDeferredPrompt(undefined)
    }
  }

  if (isStandalone) {
    return null // Don't show install button if already installed
  }

  return (
    <>
      {isIOS ? (
        <p className="flex w-fit mx-auto items-center gap-2 p-4 text-center">
          홈 화면에 추가하려면 Safari의 공유 버튼
          <svg
            className="text-foreground w-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" x2="12" y1="2" y2="15"></line>
          </svg>
          을 누른 후 {'"'}홈 화면에 추가{'"'}
          <svg
            className="text-foreground w-6"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <rect height="18" rx="2" ry="2" width="18" x="3" y="3"></rect>
            <line x1="12" x2="12" y1="8" y2="16"></line>
            <line x1="8" x2="16" y1="12" y2="12"></line>
          </svg>
          를 선택하세요.
        </p>
      ) : (
        <button
          className="mx-auto text-white rounded-lg border-2 border-brand-gradient hover:brightness-125 active:brightness-75 transition"
          onClick={handleAddToHomeScreen}
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <svg
              className="w-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" x2="12" y1="15" y2="3"></line>
            </svg>
            홈 화면에 추가
          </div>
        </button>
      )}
    </>
  )
}
