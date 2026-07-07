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

type GridContext = {
  footer?: ReactNode
  header?: ReactNode
}

type GridMeasurement = {
  columnCount: number
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

  // 외부 컨테이너 너비와 CSS 변수 기반 최소 컬럼 너비를 측정해 컬럼 수를 결정해요.
  // react-virtuoso가 세로 가상화·동적 행 높이를 담당하므로 높이는 측정하지 않아요.
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
        const minColumnWidth = readMangaGridColumnMinWidth(measuredElement) ?? width
        const columnCount = getVirtualMangaGridColumnCount(width, minColumnWidth, itemGap)

        if (
          previous &&
          previous.columnCount === columnCount &&
          previous.minColumnWidth === minColumnWidth &&
          previous.width === width
        ) {
          return previous
        }

        return { columnCount, minColumnWidth, width }
      })
    }

    measure()

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
          style={{ height: '100%' }}
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
    return raw ? (JSON.parse(raw) as StateSnapshot) : undefined
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
