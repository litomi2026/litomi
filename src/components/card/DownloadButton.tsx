'use client'

import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import Cookies from 'js-cookie'
import { Download, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { ImageWithVariants } from '@/types/manga'

import {
  disableJuicyPopunder,
  enableJuicyPopunder,
  JUICY_POPUNDER_TRIGGER_CLASS,
} from '@/components/ads/juicy-ads/popunder'
import { CookieKey } from '@/constants/storage'
import { useDownload } from '@/hook/useDownload'
import { useThrottleValue } from '@/hook/useThrottleValue'
import { AdultState } from '@/utils/adult-verification'

const commonButtonStyle =
  'relative flex justify-center items-center gap-1 overflow-hidden transition disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-900 active:border-zinc-700'

const THROTTLE_DELAY = 300

type Props = {
  manga: {
    id: number
    title: string
    images?: ImageWithVariants[]
  }
  className?: string
}

export default function DownloadButton({ manga, className = '' }: Props) {
  const { adultState, isDownloading, downloadedCount, downloadAllImages } = useDownload({ manga })
  const throttledCount = useThrottleValue(downloadedCount, THROTTLE_DELAY)

  const { images = [] } = manga
  const totalCount = images.length
  const progress = totalCount > 0 ? Math.round((throttledCount / totalCount) * 100) : 0
  const isDisabled = isDownloading || totalCount === 0
  const label = getProgressText({ isDownloading, progress, throttledCount, totalCount })
  const progressWidth = isDownloading ? `${Math.max(progress, 6)}%` : '0%'
  const hasAuthHint = Cookies.get(CookieKey.AUTH_HINT) === '1'
  const shouldEnablePopunder = shouldEnableDownloadButtonPopunder({ adultState, hasAuthHint })

  useEffect(() => {
    if (shouldEnablePopunder) {
      enableJuicyPopunder()
    } else {
      disableJuicyPopunder()
    }
  }, [shouldEnablePopunder])

  return (
    <button
      aria-busy={isDownloading}
      className={twMerge(commonButtonStyle, JUICY_POPUNDER_TRIGGER_CLASS, className)}
      disabled={isDisabled}
      onClick={downloadAllImages}
      title={getButtonTitle({ isDownloading, label, totalCount })}
      type="button"
    >
      {isDownloading && (
        <div className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-foreground/70 transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: progressWidth }}
          />
        </div>
      )}

      {isDownloading ? (
        <Loader2 className="relative z-10 size-4 animate-spin" />
      ) : (
        <Download className="relative z-10 size-4" />
      )}
      <span aria-busy={isDownloading} className="relative z-10 truncate text-sm text-foreground aria-busy:font-mono">
        {label}
      </span>
    </button>
  )
}

export function DownloadButtonError({ error, reset }: Readonly<ErrorBoundaryFallbackProps>) {
  useEffect(() => {
    toast.error('다운로드 중 오류가 발생했어요')
  }, [error])

  return (
    <button
      className={twMerge(commonButtonStyle, 'flex-1 border-2 border-red-800 text-red-500')}
      onClick={reset}
      type="button"
    >
      <Download className="size-4" />
      <span>오류</span>
    </button>
  )
}

function getButtonTitle({
  isDownloading,
  label,
  totalCount,
}: {
  isDownloading: boolean
  label: string
  totalCount: number
}) {
  if (totalCount === 0) {
    return '다운로드할 이미지가 없어요'
  }

  if (!isDownloading) {
    return `이미지 ${totalCount}장 다운로드`
  }

  return `다운로드 진행 중 ${label}`
}

function getProgressText({
  isDownloading,
  progress,
  throttledCount,
  totalCount,
}: {
  isDownloading: boolean
  progress: number
  throttledCount: number
  totalCount: number
}) {
  if (totalCount === 0) {
    return '이미지 없음'
  }

  if (!isDownloading) {
    return '다운로드'
  }

  if (progress === 0) {
    return '준비 중'
  }

  if (progress >= 100) {
    return '압축 중'
  }

  return totalCount > 20 ? `${throttledCount}/${totalCount}` : `${progress}%`
}

function shouldEnableDownloadButtonPopunder({
  adultState,
  hasAuthHint,
}: {
  adultState: AdultState
  hasAuthHint: boolean
}) {
  if (adultState === AdultState.ADULT) {
    return false
  }

  if (adultState === AdultState.UNRESOLVED) {
    return !hasAuthHint
  }

  return true
}
