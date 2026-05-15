'use client'

import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { checkCapacitorApp } from '@/utils/browser'

const ONLINE_OFFLINE_TOAST_ID = 'online-offline-toast'

export default function ServiceWorkerRegistrar() {
  const [isOffline, setIsOffline] = useState(false)

  // NOTE: 서비스 워커 등록하기
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    if (checkCapacitorApp()) {
      disableServiceWorkers()
      return
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => console.error('서비스 워커 등록에 실패했어요:', error))
  }, [])

  // NOTE: 오프라인 모드 확인하기
  useEffect(() => {
    setIsOffline(!navigator.onLine)

    function handleOnline() {
      setIsOffline(false)
      toast.success('인터넷 연결이 복원됐어요', { id: ONLINE_OFFLINE_TOAST_ID })
    }

    function handleOffline() {
      setIsOffline(true)
      toast.warning('오프라인 모드로 전환됐어요', { id: ONLINE_OFFLINE_TOAST_ID })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOffline) {
    return (
      <div className="fixed bottom-20 left-4 z-40">
        <div className="flex items-center gap-2 text-sm rounded-lg bg-background border border-border shadow-lg px-3 py-2">
          <WifiOff className="size-4 text-yellow-500" />
          <span className="text-yellow-500">오프라인</span>
        </div>
      </div>
    )
  }

  return null
}

async function disableServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))

    if ('caches' in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)))
    }
  } catch (error) {
    console.error('서비스 워커 비활성화에 실패했어요:', error)
  }
}
