'use client'

import { Maximize } from 'lucide-react'
import { type ComponentProps, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

export default function FullscreenButton({ className, ...props }: ComponentProps<'button'>) {
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false)

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => toast.warning('전체화면 전환에 실패했어요'))
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => toast.warning('전체화면 종료에 실패했어요'))
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
      title="전체화면"
      type="button"
      {...props}
    >
      <Maximize className="size-6" />
      <span className="text-sm font-semibold hidden lg:inline">전체화면</span>
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
