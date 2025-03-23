'use client'

import { CANONICAL_URL } from '@/constants/url'
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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalledApp, setIsInstalledApp] = useState(false)

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
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // getInstalledRelatedApps API를 사용해 PWA 설치 여부 확인 (Chrome 등 최신 브라우저 전용)
  useEffect(() => {
    if (
      'getInstalledRelatedApps' in window.navigator &&
      typeof window.navigator.getInstalledRelatedApps === 'function'
    ) {
      window.navigator.getInstalledRelatedApps().then((apps: unknown[]) => {
        if (apps && apps.length > 0) {
          setIsInstalledApp(true)
        }
      })
    }
  }, [])

  // PWA 환경(standalone)에서는 버튼 표시하지 않음
  if (isStandalone) return null

  // 앱이 설치된 상태라면 "앱에서 보기" 버튼 표시
  if (isInstalledApp) {
    return (
      <button
        className="mx-auto text-white rounded-lg border-2 border-brand-gradient hover:brightness-125 active:brightness-75 transition"
        onClick={() => (window.location.href = CANONICAL_URL)}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          <span>앱에서 보기</span>
        </div>
      </button>
    )
  }

  // 앱이 설치되지 않은 상태 (iOS): 설치 인스트럭션
  if (isIOS) {
    return (
      <p className="flex flex-wrap justify-center items-center gap-2 w-fit mx-auto p-4 text-sm">
        홈 화면에 추가하려면 Safari에서&nbsp;
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
        </span>
        을 눌러 {'"'}홈 화면에 추가{'"'}를 선택하세요.
      </p>
    )
  }

  // "홈 화면에 추가" 프롬프트 처리
  const handleAddToHomeScreen = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`사용자 응답: ${outcome}`)
      setDeferredPrompt(null)
    }
  }

  // 앱이 설치되지 않은 상태: "홈 화면에 추가" 버튼
  return (
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
        <span>홈 화면에 추가</span>
      </div>
    </button>
  )
}
