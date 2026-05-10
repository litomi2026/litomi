import { type RefObject, useEffect } from 'react'

import type { WheelHandlerResult } from './viewerZoom'

type Params = {
  element?: HTMLElement | null
  handleCursorZoomWheel: (event: WheelEvent) => WheelHandlerResult
  scrollRef?: RefObject<HTMLElement | null>
}

export default function useViewerWheel({ element, handleCursorZoomWheel, scrollRef }: Params) {
  useEffect(() => {
    const wheelTarget = element ?? scrollRef?.current
    if (!wheelTarget) {
      return
    }

    function handleWheel(event: WheelEvent) {
      handleCursorZoomWheel(event)
    }

    wheelTarget.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      wheelTarget.removeEventListener('wheel', handleWheel)
    }
  }, [element, handleCursorZoomWheel, scrollRef])
}
