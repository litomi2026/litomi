import { type RefObject, useEffect, useRef } from 'react'

import { useReaderStore } from '../store/reader'

type Params = {
  scrollRef: RefObject<HTMLDivElement | null>
}

export default function usePageViewerScrollRestoration({ scrollRef }: Params) {
  const getOrientation = useReaderStore((state) => state.getOrientation)
  const currentIndex = useReaderStore((state) => state.pageIndex)
  const previousIndexRef = useRef(currentIndex)

  // NOTE: 이미지 스크롤 가능할 때 페이지 변경 시 스크롤 위치를 자연스럽게 설정함
  useEffect(() => {
    const scroll = scrollRef.current
    if (!scroll) {
      return
    }

    const isVerticallyScrollable = scroll.scrollHeight > scroll.clientHeight
    const isHorizontallyScrollable = scroll.scrollWidth > scroll.clientWidth

    if (!isVerticallyScrollable && !isHorizontallyScrollable) {
      return
    }

    const isNavigatingBackward = currentIndex < previousIndexRef.current
    const orientation = getOrientation()
    previousIndexRef.current = currentIndex

    if (isNavigatingBackward) {
      if (orientation === 'vertical') {
        scroll.scrollTo({ top: scroll.scrollHeight - scroll.clientHeight, left: 0, behavior: 'instant' })
      } else if (orientation === 'vertical-reverse') {
        scroll.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } else if (orientation === 'horizontal-reverse') {
        scroll.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } else {
        scroll.scrollTo({ top: 0, left: scroll.scrollWidth - scroll.clientWidth, behavior: 'instant' })
      }
    } else {
      if (orientation === 'vertical-reverse') {
        scroll.scrollTo({ top: scroll.scrollHeight - scroll.clientHeight, left: 0, behavior: 'instant' })
      } else if (orientation === 'horizontal-reverse') {
        scroll.scrollTo({ top: 0, left: scroll.scrollWidth - scroll.clientWidth, behavior: 'instant' })
      } else {
        scroll.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    }
  }, [currentIndex, getOrientation, scrollRef])
}
