'use client'

import { Maximize } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type ComponentProps, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

export default function FullscreenButton({ className, ...props }: ComponentProps<'button'>) {
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false)
  const t = useTranslations('MangaViewer.fullscreen')

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => toast.warning(t('enterError')))
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => toast.warning(t('exitError')))
    }
  }

  useEffect(() => {
    setIsFullscreenSupported(getIsFullscreenSupported())
  }, [])

  if (!isFullscreenSupported) {
    return null
  }

  return (
    <button
      className={twMerge('flex gap-2 items-center', className)}
      onClick={toggleFullScreen}
      title={t('label')}
      type="button"
      {...props}
    >
      <Maximize className="size-6" />
      <span className="text-sm font-semibold hidden lg:inline">{t('label')}</span>
    </button>
  )
}

function getIsFullscreenSupported() {
  return (
    document.fullscreenEnabled &&
    typeof document.documentElement.requestFullscreen === 'function' &&
    typeof document.exitFullscreen === 'function'
  )
}
