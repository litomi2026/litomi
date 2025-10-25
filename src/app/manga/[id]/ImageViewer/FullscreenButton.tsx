'use client'

import { ComponentProps, memo } from 'react'
import { toast } from 'sonner'

import { IconMaximize } from '@/components/icons/IconImageViewer'

export default memo(FullscreenButton)

function FullscreenButton(props: ComponentProps<'button'>) {
  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => toast.warning('전체화면 전환에 실패했어요'))
      } else {
        toast.warning('이 브라우저는 전체화면 기능을 지원하지 않아요')
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => toast.warning('전체화면 종료에 실패했어요'))
    }
  }

  return (
    <button aria-label="전체화면" onClick={toggleFullScreen} {...props}>
      <IconMaximize className="size-6" />
    </button>
  )
}
