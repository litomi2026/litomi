'use client'

import { View } from '@litomi/std'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ListImperativeAPI } from 'react-window'
import { List, useDynamicRowHeight } from 'react-window'
import { twMerge } from 'tailwind-merge'

import { useIsomorphicLayoutEffect } from '@/hook/useIsomorphicLayoutEffect'
import { MANGA_GRID_COLUMN_MIN_WIDTH_CLASS, readMangaGridColumnMinWidth } from '@/utils/style'
import { useVirtualScrollRestoration, type VirtualScrollAnchor } from './VirtualMangaGrid.scrollRestoration'
import type {
  VirtualMangaGridItem,
  VirtualMangaGridProps,
  VirtualMangaGridRow as VirtualMangaGridRowData,
  VirtualMangaGridRowProps,
  VirtualMangaGridSize,
} from './VirtualMangaGrid.types'
import { chunkVirtualMangaGridItems, getVirtualMangaGridColumnCount } from './VirtualMangaGrid.utils'
import VirtualMangaGridRow from './VirtualMangaGridRow'

const DEFAULT_OVERSCAN_COUNT = 3
const DEFAULT_PRELOAD_ROW_COUNT = 1
const DEFAULT_HEIGHT = 640
const IMAGE_ITEM_ASPECT_HEIGHT_RATIO = 7 / 5
const CARD_ITEM_ASPECT_HEIGHT_RATIO = 4 / 3
const ESTIMATED_CARD_BODY_HEIGHT_PX = 420
const RESIZE_MEASURE_DEBOUNCE_MS = 100

type VirtualMangaGridBodyProps<TItem extends VirtualMangaGridItem> = VirtualMangaGridProps<TItem> & {
  size: VirtualMangaGridSize
}

export default function VirtualMangaGrid<TItem extends VirtualMangaGridItem>(props: VirtualMangaGridProps<TItem>) {
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

    // ResizeObserver 콜백을 디바운스해요. 동적 행 높이가 스크롤 중 컨테이너 크기를 미세하게 흔들면
    // measure→리렌더→react-window 재측정→scroll→setIndices→… 피드백 루프(Maximum update depth)가 생겨요.
    let debounceId: number | undefined

    const observer = new ResizeObserver(() => {
      window.clearTimeout(debounceId)
      debounceId = window.setTimeout(measure, RESIZE_MEASURE_DEBOUNCE_MS)
    })

    observer.observe(measuredElement)

    return () => {
      window.clearTimeout(debounceId)
      observer.disconnect()
    }
  }, [view])

  return (
    <div className={twMerge('min-h-0 flex-1', MANGA_GRID_COLUMN_MIN_WIDTH_CLASS[view], className)} ref={outerRef}>
      {size && <VirtualMangaGridBody {...props} size={size} />}
    </div>
  )
}

function createScrollRestorationKey(key: string) {
  return typeof window === 'undefined' ? key : `${window.location.href}:${key}`
}

function measureVirtualMangaGridElement(element: HTMLElement): VirtualMangaGridSize {
  const rect = element.getBoundingClientRect()
  const width = Math.round(rect.width || element.clientWidth || window.innerWidth || 1)
  const viewportHeight = window.innerHeight || DEFAULT_HEIGHT
  const height = Math.round(rect.height || element.clientHeight || Math.max(320, viewportHeight - rect.top))
  const minColumnWidth = readMangaGridColumnMinWidth(element) ?? width

  return {
    height: Math.max(1, height),
    minColumnWidth,
    width: Math.max(1, width),
  }
}

function VirtualMangaGridBody<TItem extends VirtualMangaGridItem>({
  fetchNextPage,
  footer,
  hasNextPage,
  header,
  isFetchingNextPage,
  itemGap = 0,
  items,
  measurementKey = '',
  onScrollElementChange,
  overscanCount = DEFAULT_OVERSCAN_COUNT,
  preloadRowCount = DEFAULT_PRELOAD_ROW_COUNT,
  renderItem,
  scrollRestorationKey = '',
  scrollToOptions,
  size,
  view,
}: VirtualMangaGridBodyProps<TItem>) {
  const [list, setList] = useState<ListImperativeAPI | null>(null)
  const fetchInFlightRef = useRef(false)

  const itemRowStartIndex = header ? 1 : 0
  const minColumnWidth = size.minColumnWidth
  const columnCount = getVirtualMangaGridColumnCount(size.width, minColumnWidth, itemGap)
  const columnWidth = Math.max(1, (size.width - itemGap * (columnCount + 1)) / Math.max(1, columnCount))

  const estimatedItemRowHeight =
    (view === View.IMAGE
      ? Math.round(columnWidth * IMAGE_ITEM_ASPECT_HEIGHT_RATIO)
      : Math.round(columnWidth * CARD_ITEM_ASPECT_HEIGHT_RATIO + ESTIMATED_CARD_BODY_HEIGHT_PX)) + itemGap

  const itemRows = useMemo(() => chunkVirtualMangaGridItems(items, columnCount), [items, columnCount])

  const rows = useMemo<VirtualMangaGridRowData<TItem>[]>(() => {
    const nextRows: VirtualMangaGridRowData<TItem>[] = []

    if (header) {
      nextRows.push({ type: 'header' })
    }

    nextRows.push(...itemRows)

    if (footer) {
      nextRows.push({ type: 'footer' })
    }

    return nextRows
  }, [footer, header, itemRows])

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: estimatedItemRowHeight,
    key: `${view}:${columnCount}:${size.width}:${estimatedItemRowHeight}:${measurementKey}`,
  })

  const rowProps = useMemo<VirtualMangaGridRowProps<TItem>>(
    () => ({
      columnCount,
      footer,
      header,
      itemGap,
      renderItem,
      rows,
    }),
    [columnCount, footer, header, itemGap, renderItem, rows],
  )

  const scrollAnchors = useMemo<VirtualScrollAnchor[]>(() => {
    const anchors: VirtualScrollAnchor[] = []

    rows.forEach((row, rowIndex) => {
      if (row.type !== 'items') {
        return
      }

      for (const { item } of row.items) {
        anchors.push({
          itemKey: String(item.key),
          rowIndex,
        })
      }
    })

    return anchors
  }, [rows])

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

  const setListRef = useCallback(
    (list: ListImperativeAPI | null) => {
      setList(list)
      onScrollElementChange?.(list?.element ?? null)
    },
    [onScrollElementChange],
  )

  useVirtualScrollRestoration({
    anchors: scrollAnchors,
    list,
    restorationKey: createScrollRestorationKey(scrollRestorationKey),
  })

  useEffect(() => {
    const element = list?.element

    if (!element || !scrollToOptions) {
      return
    }

    element.scrollTo(scrollToOptions)
  }, [list, scrollToOptions])

  return (
    <List
      className="scrollbar-gutter-stable"
      defaultHeight={DEFAULT_HEIGHT}
      listRef={setListRef}
      onRowsRendered={handleVisibleRowsRendered}
      overscanCount={overscanCount}
      rowComponent={VirtualMangaGridRow<TItem>}
      rowCount={rows.length}
      rowHeight={rowHeight}
      rowProps={rowProps}
      style={{
        height: size.height,
        width: size.width,
      }}
    />
  )
}
