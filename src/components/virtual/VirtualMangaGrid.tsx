const DEFAULT_OVERSCAN_COUNT = 3
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
export default function VirtualMangaGrid<T>(props: VirtualMangaGridProps<T>) {
  const { className = '', view } = props
  const outerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<VirtualMangaGridSize | null>(null)

  // NOTE: 외부 컨테이너 크기와 CSS 변수 기반 최소 컬럼 너비를 측정해 가상 리스트 크기를 결정해요
  useIsomorphicLayoutEffect(() => {
    const outer = outerRef.current

    if (!outer) {
      return
    }

    const measuredElement = outer

    function measure() {
      setSize((previous) => {
        const next = measureVirtualMangaGridElement(measuredElement)

        if (
          previous &&
          previous.height === next.height &&
          previous.minColumnWidth === next.minColumnWidth &&
          previous.width === next.width
        ) {
          return previous
        }

        return next
      })
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(measuredElement)

    return () => observer.disconnect()
  }, [view])

  return (
    <div className={twMerge('min-h-0 flex-1', MANGA_GRID_COLUMN_MIN_WIDTH_CLASS[view], className)} ref={outerRef}>
      {size && <VirtualMangaGridBody {...props} size={size} />}
    </div>
  )
}

  const listRef = useRef<ListImperativeAPI | null>(null)
  const fetchInFlightRef = useRef(false)
  const lastScrollToTopSignalRef = useRef(scrollToTopSignal)
  const handleVisibleRowsRendered = useCallback(
    async ({ stopIndex }: { stopIndex: number }) => {
      if (!fetchNextPage || !hasNextPage || isFetchingNextPage || fetchInFlightRef.current) {
        return
      }

      const lastItemRowIndex = itemRowStartIndex + itemRows.length - 1
      const preloadStartIndex = Math.max(0, lastItemRowIndex - preloadRowCount)

      if (lastItemRowIndex < 0 || stopIndex < preloadStartIndex) {
        return
      }

      fetchInFlightRef.current = true

      try {
        await fetchNextPage()
      } finally {
        fetchInFlightRef.current = false
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, itemRows.length, itemRowStartIndex, preloadRowCount],
  )

  // NOTE: scrollToTopSignal 값이 바뀔 때 상단으로 스크롤해요
  useEffect(() => {
    if (lastScrollToTopSignalRef.current === scrollToTopSignal) {
      return
    }

    lastScrollToTopSignalRef.current = scrollToTopSignal

    const element = listRef.current?.element

    if (!element) {
      return
    }

    element.scrollTo({ behavior: scrollToTopBehavior, top: 0 })
  }, [scrollToTopBehavior, scrollToTopSignal])

  return (
    <List
      className="[scrollbar-gutter:stable]"
      listRef={listRef}
      overscanCount={overscanCount}
      rowComponent={VirtualMangaGridRow<T>}
