'use client'

import type { ImageWithVariants } from '@litomi/domain/manga/model'

import { CookieKey } from '@litomi/http/cookie'
import type { ErrorBoundaryFallbackProps } from '@suspensive/react'
import Cookies from 'js-cookie'
import { Download, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import {
  disableJuicyPopunder,
  enableJuicyPopunder,
  JUICY_POPUNDER_TRIGGER_CLASS,
} from '@/components/ads/juicy-ads/popunder'
import { useDownload } from '@/hook/useDownload'
import { useThrottleValue } from '@/hook/useThrottleValue'
import { usePathname } from '@/i18n/navigation'
import { isAdultVerified } from '@/utils/adult-verification'

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
  const { isDownloading, downloadedCount, downloadAllImages, me } = useDownload({ manga })
  const throttledCount = useThrottleValue(downloadedCount, THROTTLE_DELAY)
  const t = useTranslations('Common.mangaCard.download')
  const pathname = usePathname()

  const { images = [] } = manga
  const totalCount = images.length
  const isDisabled = isDownloading || totalCount === 0
  const hasAuthHint = Cookies.get(CookieKey.AUTH_HINT) === '1'
  const shouldEnablePopunder = me === undefined ? !hasAuthHint : !isAdultVerified(me)
  const shouldAttachPopunder = shouldEnablePopunder && !isDisabled
  const progress = totalCount > 0 ? Math.round((throttledCount / totalCount) * 100) : 0
  const progressWidth = isDownloading ? `${Math.max(progress, 6)}%` : '0%'
  const label = getProgressText()
  const title = getButtonTitle(label)

  function getProgressText() {
    if (totalCount === 0) {
      return t('noImages')
    }

    if (!isDownloading) {
      return t('action')
    }

    if (progress === 0) {
      return t('preparing')
    }

    if (progress >= 100) {
      return t('saving')
    }

    return totalCount > 20 ? `${throttledCount}/${totalCount}` : `${progress}%`
  }

  function getButtonTitle(label: string) {
    if (totalCount === 0) {
      return t('noImagesTitle')
    }

    if (!isDownloading) {
      return t('actionTitle', { count: totalCount })
    }

    return t('progressTitle', { label })
  }

  useEffect(() => {
    if (!shouldAttachPopunder) {
      return
    }

    enableJuicyPopunder().catch(() => undefined)

    return () => {
      disableJuicyPopunder()
    }
  }, [pathname, shouldAttachPopunder])

  return (
    <button
      aria-busy={isDownloading}
      className={twMerge(commonButtonStyle, shouldAttachPopunder && JUICY_POPUNDER_TRIGGER_CLASS, className)}
      disabled={isDisabled}
      onClick={downloadAllImages}
      title={title}
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
      <span aria-busy={isDownloading} className="relative z-10 truncate text-sm text-current aria-busy:font-mono">
        {label}
      </span>
    </button>
  )
}

export function DownloadButtonError({ error, reset }: ErrorBoundaryFallbackProps) {
  const t = useTranslations('Common.mangaCard.download')

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
      <span>{t('error')}</span>
    </button>
  )
}
