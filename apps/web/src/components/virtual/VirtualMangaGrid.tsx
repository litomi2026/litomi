'use client'

import type { ReactNode } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import type { StateSnapshot, VirtuosoHandle } from 'react-virtuoso'
import { Virtuoso } from 'react-virtuoso'
import { twMerge } from 'tailwind-merge'

import { useIsomorphicLayoutEffect } from '@/hook/useIsomorphicLayoutEffect'
import { MANGA_GRID_COLUMN_MIN_WIDTH_CLASS, readMangaGridColumnMinWidth } from '@/utils/style'
import type { VirtualMangaGridItem, VirtualMangaGridProps, VirtualMangaGridRow } from './VirtualMangaGrid.types'
import { chunkVirtualMangaGridItems, getVirtualMangaGridColumnCount } from './VirtualMangaGrid.utils'

const RESIZE_MEASURE_DEBOUNCE_MS = 100
const VIEWPORT_OVERSCAN_PX = 800
const MIN_MEASURED_HEIGHT = 320
const DEFAULT_VIEWPORT_HEIGHT = 640

type GridContext = {
  footer?: ReactNode
  header?: ReactNode
}

type GridMeasurement = {
  columnCount: number
  height: number
  minColumnWidth: number
  width: number
}

export default function VirtualMangaGrid<TItem extends VirtualMangaGridItem>({
  className = '',
  fetchNextPage,
  footer,
  hasNextPage,
  header,
  isFetchingNextPage,
  itemGap = 0,
  items,
  onScrollElementChange,
  renderItem,
  scrollRestorationKey = '',
  scrollToOptions,
  view,
}: VirtualMangaGridProps<TItem>) {
  const outerRef = useRef<HTMLDivElement>(null)
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const fetchInFlightRef = useRef(false)
  const [measurement, setMeasurement] = useState<GridMeasurement | null>(null)

  const columnCount = measurement?.columnCount ?? 0
  const rows: VirtualMangaGridRow<TItem>[] = columnCount > 0 ? chunkVirtualMangaGridItems(items, columnCount) : []
  const storageKey = createScrollRestorationStorageKey(scrollRestorationKey)

  function handleEndReached() {
    if (!fetchNextPage || !hasNextPage || isFetchingNextPage || fetchInFlightRef.current) {
      return
    }

    fetchInFlightRef.current = true

    Promise.resolve(fetchNextPage()).finally(() => {
      fetchInFlightRef.current = false
    })
  }

  function handleScrollerRef(element: HTMLElement | Window | null) {
    onScrollElementChange?.(element instanceof HTMLElement ? element : null)
  }

  function renderRow(index: number, row: VirtualMangaGridRow<TItem>) {
    return (
      <div
        className="grid"
        style={{
          gap: itemGap,
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          paddingBottom: itemGap,
          paddingInline: itemGap,
          paddingTop: index === 0 ? itemGap : 0,
        }}
      >
        {row.items.map(({ item, itemIndex }) => (
          <Fragment key={item.key}>{renderItem(item, itemIndex)}</Fragment>
        ))}
      </div>
    )
  }

  // 외부 컨테이너의 너비·높이와 CSS 변수 기반 최소 컬럼 너비를 측정해요.
  // Virtuoso엔 픽셀 높이를 넘겨요 — 앱 셸이 min-height 기반 document-flow라 `height:100%`가
  // 모바일(flex-col) WebKit에서 확정되지 않아 0으로 붕괴하기 때문이에요.
  useIsomorphicLayoutEffect(() => {
    const element = outerRef.current

    if (!element) {
      return
    }

    const measuredElement = element

    function measure() {
      setMeasurement((previous) => {
        const rect = measuredElement.getBoundingClientRect()
        const width = Math.max(1, Math.round(rect.width || measuredElement.clientWidth || window.innerWidth || 1))
        const viewportHeight = window.innerHeight || DEFAULT_VIEWPORT_HEIGHT

        const height = Math.max(
          1,
          Math.round(
            rect.height || measuredElement.clientHeight || Math.max(MIN_MEASURED_HEIGHT, viewportHeight - rect.top),
          ),
        )

        const minColumnWidth = readMangaGridColumnMinWidth(measuredElement) ?? width
        const columnCount = getVirtualMangaGridColumnCount(width, minColumnWidth, itemGap)

        if (
          previous &&
          previous.columnCount === columnCount &&
          previous.height === height &&
          previous.minColumnWidth === minColumnWidth &&
          previous.width === width
        ) {
          return previous
        }

        return { columnCount, height, minColumnWidth, width }
      })
    }

    measure()

    let debounceId: number | undefined

    function scheduleMeasure() {
      window.clearTimeout(debounceId)
      debounceId = window.setTimeout(measure, RESIZE_MEASURE_DEBOUNCE_MS)
    }

    const observer = new ResizeObserver(scheduleMeasure)

    observer.observe(measuredElement)
    window.addEventListener('resize', scheduleMeasure)

    return () => {
      window.clearTimeout(debounceId)
      observer.disconnect()
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [itemGap, view])

  // 이탈(pagehide)·언마운트 시 현재 스크롤 상태를 저장해 재방문 시 복원해요.
  useEffect(() => {
    if (!measurement) {
      return
    }

    function saveSnapshot() {
      virtuosoRef.current?.getState((snapshot) => writeScrollSnapshot(storageKey, snapshot))
    }

    window.addEventListener('pagehide', saveSnapshot)

    return () => {
      window.removeEventListener('pagehide', saveSnapshot)
      saveSnapshot()
    }
  }, [measurement, storageKey])

  useEffect(() => {
    if (!scrollToOptions) {
      return
    }

    virtuosoRef.current?.scrollTo(scrollToOptions)
  }, [scrollToOptions])

  return (
    <div className={twMerge('min-h-0 flex-1', MANGA_GRID_COLUMN_MIN_WIDTH_CLASS[view], className)} ref={outerRef}>
      {measurement && (
        <Virtuoso<VirtualMangaGridRow<TItem>, GridContext>
          className="scrollbar-gutter-stable"
          components={GRID_COMPONENTS}
          computeItemKey={(index, row) => String(row.items[0]?.item.key ?? index)}
          context={{ footer, header }}
          data={rows}
          endReached={handleEndReached}
          increaseViewportBy={VIEWPORT_OVERSCAN_PX}
          itemContent={renderRow}
          key={storageKey}
          ref={virtuosoRef}
          restoreStateFrom={readScrollSnapshot(storageKey)}
          scrollerRef={handleScrollerRef}
          style={{ height: measurement.height }}
        />
      )}
    </div>
  )
}

function GridHeader({ context }: { context?: GridContext }) {
  return <>{context?.header}</>
}

function GridFooter({ context }: { context?: GridContext }) {
  return <>{context?.footer}</>
}

const GRID_COMPONENTS = {
  Footer: GridFooter,
  Header: GridHeader,
}

function createScrollRestorationStorageKey(scrollRestorationKey: string) {
  const scope = typeof window === 'undefined' ? '' : window.location.href
  return `virtual-scroll:${scope}:${scrollRestorationKey}`
}

function readScrollSnapshot(storageKey: string): StateSnapshot | undefined {
  try {
    const raw = window.sessionStorage.getItem(storageKey)
    if (!raw) {
      return undefined
    }

    const parsed = JSON.parse(raw) as Partial<StateSnapshot>

    if (!Array.isArray(parsed.ranges) || typeof parsed.scrollTop !== 'number') {
      return undefined
    }

    return parsed as StateSnapshot
  } catch {
    return undefined
  }
}

function writeScrollSnapshot(storageKey: string, snapshot: StateSnapshot) {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot))
  } catch {
    // 저장 용량·브라우저 프라이버시 설정이 내비게이션을 막지 않도록 무시해요.
  }
}
