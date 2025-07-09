import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  fetchNextPage: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  rootMargin?: string
  threshold?: number
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 0.1,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold, rootMargin },
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold, rootMargin])

  return loadMoreRef
}
