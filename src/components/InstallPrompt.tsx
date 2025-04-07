'use client'

import { memo, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { IconDownload } from './icons/IconDownload'

declare global {
  export interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt(): Promise<void>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export default memo(InstallPrompt)

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => toast.error('서비스 워커 등록에 실패했습니다.'))
    }
  }, [])

  // iOS 판별
  useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window))
  }, [])

  // PWA 환경(standalone) 판별
  useEffect(() => {
    const checkStandalone = () => {
      const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches
      const legacyStandalone = 'standalone' in window.navigator && window.navigator.standalone === true
      setIsStandalone(standaloneMedia || legacyStandalone)
    }
    checkStandalone()
    window.addEventListener('focus', checkStandalone)
    return () => window.removeEventListener('focus', checkStandalone)
  }, [])

  // beforeinstallprompt 이벤트 리스너
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // PWA 환경(standalone)에서는 버튼 표시하지 않음
  if (isStandalone) return null

  // 앱이 설치되지 않은 상태 (iOS): 설치 인스트럭션
  if (isIOS) {
    return (
      <p className="flex flex-wrap justify-center items-center gap-2 w-fit mx-auto p-4 text-sm">
        홈 화면에 추가하려면 Safari에서
        <span className="flex items-center gap-1">
          공유 버튼
          <svg
            className="text-foreground w-5"
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
          을
        </span>
        눌러 {'"'}홈 화면에 추가{'"'}를 선택하세요.
      </p>
    )
  }

  // 앱이 설치되지 않은 상태: "홈 화면에 추가" 버튼 표시
  if (deferredPrompt) {
    return (
      <button
        className="mx-auto text-foreground rounded-lg border-2 border-brand-gradient hover:brightness-125 active:brightness-75 transition"
        onClick={async () => {
          await deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          console.log(`사용자 응답: ${outcome}`)
          setDeferredPrompt(null)
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold">
          <IconDownload className="w-5" />
          <span>홈 화면에 추가</span>
        </div>
      </button>
    )
  }

  return null
}
