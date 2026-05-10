import { type RefObject, useEffect } from 'react'

import type { WheelHandlerResult } from './pageViewerWheel'

type Params = {
  handleCursorZoomWheel: (event: WheelEvent) => WheelHandlerResult
  scrollRef: RefObject<HTMLDivElement | null>
}

export default function usePageViewerWheel({ handleCursorZoomWheel, scrollRef }: Params) {
  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) {
      return
    }

    const wheelTarget = scrollElement

    function handleWheel(event: WheelEvent) {
      handleCursorZoomWheel(event)
    }

    wheelTarget.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      wheelTarget.removeEventListener('wheel', handleWheel)
    }
  }, [handleCursorZoomWheel, scrollRef])
}
