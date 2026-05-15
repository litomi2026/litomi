'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function InternalServerError({ error, reset }: ErrorBoundaryFallbackProps) {
  const pathname = usePathname()
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    captureException(error, { extra: { pathname } })
  }, [error, pathname])

  async function handleRetry() {
    setIsRetrying(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    reset()
    setIsRetrying(false)
  }

  return (
    <div className="animate-fade-in-fast flex flex-col items-center gap-3 p-6 rounded-2xl bg-red-950/20 border border-red-900/30 shadow-lg">
      <div className="size-10 rounded-full bg-red-950/50 flex items-center justify-center">
        <TriangleAlert className="size-5 text-red-500" />
      </div>
      <p className="text-sm text-red-200/80 text-center">일시적인 문제가 발생했습니다</p>
      <button
        className="relative overflow-hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-100/90 bg-red-900/30 border border-red-800/40 rounded-full transition
        hover:bg-red-800/40 hover:border-red-700/50 hover:text-red-50 disabled:opacity-50"
        disabled={isRetrying}
        onClick={handleRetry}
      >
        <RefreshCw aria-busy={isRetrying} className="size-4 transition aria-busy:animate-spin" />
        <span>{isRetrying ? '재시도 중' : '다시 시도'}</span>
      </button>
    </div>
  )
}
