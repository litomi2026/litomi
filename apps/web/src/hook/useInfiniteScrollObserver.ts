import type { RefObject } from 'react'

import { useEffect, useRef } from 'react'

interface Params {
  fetchNextPage: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  rootMargin?: string
  rootRef?: RefObject<Element | null>
  threshold?: number
}

export default function useInfiniteScrollObserver({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 0.1,
  rootMargin = '100px',
  rootRef,
}: Params) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef) {
      return
    }

    const root = rootRef?.current ?? null
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry) {
          return
        }
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold, rootMargin, root },
    )

    observer.observe(currentRef)

    return () => {
      observer.unobserve(currentRef)
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold, rootMargin, rootRef])

  return loadMoreRef
}
