'use client'

import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { Download } from 'lucide-react'
import { memo, useEffect } from 'react'
import { toast } from 'sonner'

import { useDownload } from '@/hook/useDownload'
import { useThrottleValue } from '@/hook/useThrottleValue'
import { ImageWithVariants } from '@/types/manga'

const commonButtonStyle = 'flex justify-center items-center gap-1'
const THROTTLE_DELAY = 300

type Props = {
  manga: {
    id: number
    title: string
    images?: ImageWithVariants[]
  }
  className?: string
}

export default memo(DownloadButton)

export function DownloadButtonError({ error, reset }: Readonly<ErrorBoundaryFallbackProps>) {
  useEffect(() => {
    toast.error('다운로드 중 오류가 발생했어요')
  }, [error])

  return (
    <button
      className={`${commonButtonStyle} flex-1 border-2 border-red-800 text-red-500`}
      onClick={reset}
      type="button"
    >
      <Download className="size-4" />
      오류
    </button>
  )
}

export function DownloadButtonSkeleton({ className = '' }: { className?: string }) {
  return (
    <button className={`${commonButtonStyle} disabled:opacity-50 ${className}`} disabled>
      <Download className="size-4" />
      다운로드
    </button>
  )
}

function DownloadButton({ manga, className = '' }: Props) {
  const { images = [] } = manga
  const { isDownloading, downloadedCount, downloadAllImages } = useDownload({ manga })
  const throttledCount = useThrottleValue(downloadedCount, THROTTLE_DELAY)
  const progress = Math.round((throttledCount / images.length) * 100)
  const totalCount = images.length

  const getProgressText = () => {
    if (!isDownloading) return '다운로드'

    if (progress === 0) return '준비 중'
    if (progress === 100) return '압축 중'

    if (totalCount > 20) {
      return `${throttledCount}/${totalCount} (${progress}%)`
    } else {
      return `${progress}%`
    }
  }

  return (
    <button
      className={`${commonButtonStyle} ${className} relative overflow-hidden`}
      disabled={isDownloading}
      onClick={downloadAllImages}
      type="button"
    >
      {/* Progress bar */}
      {isDownloading && (
        <div
          className="absolute inset-0 bg-background opacity-50 transition ease-out"
          style={{ transform: `translateX(-${100 - progress}%)` }}
        />
      )}
      {/* Content */}
      <Download
        aria-busy={isDownloading}
        className="size-4 shrink-0 text-foreground aria-busy:animate-pulse relative z-10"
      />
      <span aria-busy={isDownloading} className="relative z-10 text-foreground aria-busy:font-mono aria-busy:text-xs">
        {getProgressText()}
      </span>
    </button>
  )
}
