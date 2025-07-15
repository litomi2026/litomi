'use client'

import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { IconDownload } from '@/components/icons/IconDownload'
import { useDownload } from '@/hook/useDownload'
import { Manga } from '@/types/manga'

const commonButtonStyle = 'flex justify-center items-center gap-1'

type Props = {
  manga: Manga
  className?: string
}

export default function DownloadButton({ manga, className = '' }: Readonly<Props>) {
  const { isDownloading, downloadProgress, downloadAllImages } = useDownload(manga)

  return (
    <button
      className={`${commonButtonStyle} ${className}`}
      disabled={isDownloading}
      onClick={downloadAllImages}
      type="button"
    >
      <IconDownload aria-busy={isDownloading} className="w-4 aria-busy:animate-pulse" />
      {isDownloading ? `${downloadProgress}% 완료` : '다운로드'}
    </button>
  )
}

export function DownloadButtonError({ error, reset }: ErrorBoundaryFallbackProps) {
  useEffect(() => {
    toast.error(error instanceof Error ? error.message : '다운로드에 실패했어요')
  }, [error])

  return (
    <button
      className={`${commonButtonStyle} flex-1 border-2 border-red-800 text-red-500`}
      onClick={reset}
      type="button"
    >
      <IconDownload className="w-4" />
      오류
    </button>
  )
}

export function DownloadButtonSkeleton({ className = '' }: { className?: string }) {
  return (
    <button className={`${commonButtonStyle} disabled:opacity-50 disabled:cursor-not-allowed ${className}`} disabled>
      <IconDownload className="w-4" />
      다운로드
    </button>
  )
}
