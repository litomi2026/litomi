'use client'

import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ServiceWorkerRegistrar() {
  const [isOffline, setIsOffline] = useState(false)

  // NOTE: 서비스 워커 등록하기
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.error('서비스 워커 등록에 실패했어요:', error))
    }
  }, [])

  // NOTE: 오프라인 모드 확인하기
  useEffect(() => {
    setIsOffline(!navigator.onLine)

    function handleOnline() {
      setIsOffline(false)
      toast.success('인터넷 연결이 복원됐어요')
    }

    function handleOffline() {
      setIsOffline(true)
      toast.warning('오프라인 모드로 전환됐어요')
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
      <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-yellow-500/10 px-3 py-2 text-sm text-yellow-500">
        <div className="flex items-center gap-2">
          <WifiOff className="size-4" />
          <span>오프라인 모드</span>
        </div>
      </div>
    )
  }

  return null
}
