'use client'

import { memo } from 'react'
import { toast } from 'sonner'

import { IconMaximize } from '../icons/IconImageViewer'

export default memo(FullscreenButton)

function FullscreenButton() {
  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      } else {
        toast.warning('이 브라우저는 전체화면 기능을 지원하지 않아요')
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }

  return (
    <button aria-label="전체화면" onClick={toggleFullScreen}>
      <IconMaximize className="w-6" />
    </button>
  )
}
