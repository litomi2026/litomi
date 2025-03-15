'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useImageIndexStore } from './store/imageIndex'
import { useNavigationModeStore } from './store/navigationMode'
import { useSlideshowStore } from './store/slideshow'
import { useVirtualizerStore } from './store/virtualizer'

type Props = {
  offset: number
  maxImageIndex: number
}

export default function Slideshow({ maxImageIndex, offset }: Props) {
  const { imageIndex, setImageIndex } = useImageIndexStore()
  const { slideshowInterval, setSlideshowInterval } = useSlideshowStore()
  const intervalIdRef = useRef<NodeJS.Timeout>(null)
  const virtualizer = useVirtualizerStore((state) => state.virtualizer)
  const navMode = useNavigationModeStore((state) => state.navMode)
  const isTouchMode = navMode === 'touch'
  const onIntervalChange = isTouchMode ? setImageIndex : virtualizer?.scrollToIndex

  useEffect(() => {
    if (!slideshowInterval || slideshowInterval <= 0) return

    intervalIdRef.current = setInterval(() => {
      if (imageIndex + offset <= maxImageIndex) {
        onIntervalChange?.(imageIndex + offset)
      } else {
        toast.info('마지막 이미지입니다.')
        clearInterval(intervalIdRef.current ?? 0)
        intervalIdRef.current = null
      }
    }, slideshowInterval * 1000)

    return () => {
      clearInterval(intervalIdRef.current ?? 0)
      intervalIdRef.current = null
    }
  }, [imageIndex, maxImageIndex, offset, onIntervalChange, slideshowInterval])

  return (
    <div>
      <input type="number" />
      <button onClick={() => setSlideshowInterval(2)}>슬라이드쇼</button>
    </div>
  )
}
