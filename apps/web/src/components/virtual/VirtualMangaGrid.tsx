'use client'

import type { ReactNode } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import type { StateSnapshot, VirtuosoHandle } from 'react-virtuoso'
import { Virtuoso } from 'react-virtuoso'

import { useIsomorphicLayoutEffect } from '@/hook/useIsomorphicLayoutEffect'
import { MANGA_GRID_COLUMN_MIN_WIDTH_CLASS, readMangaGridColumnMinWidth } from '@/utils/style'
import type { VirtualMangaGridItem, VirtualMangaGridProps, VirtualMangaGridRow } from './VirtualMangaGrid.types'
import { chunkVirtualMangaGridItems, getVirtualMangaGridColumnCount } from './VirtualMangaGrid.utils'

const RESIZE_MEASURE_DEBOUNCE_MS = 300
const SCROLL_SNAPSHOT_THROTTLE_MS = 300
const VIEWPORT_OVERSCAN_PX = 900
const DEFAULT_ITEM_GAP = 8

type GridContext = {
  footer?: ReactNode
  header?: ReactNode
}

type GridColumns = {
  columnCount: number
  minColumnWidth: number
  width: number
}

type GridListProps<TItem extends VirtualMangaGridItem> = {
  columnCount: number
  fetchNextPage: VirtualMangaGridProps<TItem>['fetchNextPage']
  footer?: ReactNode
  hasNextPage: boolean
  header?: ReactNode
  identity: string
  isFullWidth?: (item: TItem) => boolean
  itemGap: number
  items: readonly TItem[]
  renderItem: (item: TItem, index: number) => ReactNode
}

export default function VirtualMangaGrid<TItem extends VirtualMangaGridItem>({
  fetchNextPage,
  footer,
  hasNextPage,
  header,
  isFullWidth,
  itemGap = DEFAULT_ITEM_GAP,
  items,
  renderItem,
  view,
}: VirtualMangaGridProps<TItem>) {
  const [columns, setColumns] = useState<GridColumns | null>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  // 컬럼 수 계산을 위해 외부 컨테이너 너비와 CSS 변수 기반 최소 컬럼 너비만 측정해요.
  // 스크롤은 window(document)가 담당하므로(useWindowScroll) 높이는 측정하지 않아요.
  useIsomorphicLayoutEffect(() => {
    const element = outerRef.current

    if (!element) {
      return
    }

    const measuredElement = element

    function measure() {
      setColumns((previous) => {
        const rect = measuredElement.getBoundingClientRect()
        const width = Math.max(1, Math.round(rect.width || measuredElement.clientWidth || window.innerWidth || 1))
        const minColumnWidth = readMangaGridColumnMinWidth(measuredElement) ?? width
        const columnCount = getVirtualMangaGridColumnCount(width, minColumnWidth, itemGap)

        if (
          previous?.columnCount === columnCount &&
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

  // 논리적 페이지(검색어 등)가 바뀌면 Virtuoso를 새로 마운트해 이전 데이터의 측정값을 버려요.
  const identity = typeof window === 'undefined' ? '' : window.location.href

  return (
    <div className={MANGA_GRID_COLUMN_MIN_WIDTH_CLASS[view]} ref={outerRef}>
      {columns && (
        <VirtualMangaGridList
          columnCount={columns.columnCount}
          fetchNextPage={fetchNextPage}
          footer={footer}
          hasNextPage={hasNextPage}
          header={header}
          identity={identity}
          isFullWidth={isFullWidth}
          itemGap={itemGap}
          items={items}
          key={identity}
          renderItem={renderItem}
        />
      )}
    </div>
  )
}

function VirtualMangaGridList<TItem extends VirtualMangaGridItem>({
  columnCount,
  fetchNextPage,
  footer,
  hasNextPage,
  header,
  identity,
  isFullWidth,
  itemGap,
  items,
  renderItem,
}: GridListProps<TItem>) {
  // 저장된 스크롤 상태는 마운트 시점에 한 번만 읽어요. 슬롯 키에 columnCount가 포함되므로
  // 저장 당시와 열 수가 다르면(기기·회전) 매칭되지 않아 자연스럽게 맨 위부터 시작해요.
  const [restoreState] = useState<StateSnapshot | undefined>(() =>
    readScrollSnapshot(createScrollRestorationStorageKey(identity, columnCount)),
  )

  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const fetchInFlightRef = useRef(false)
  const rows = chunkVirtualMangaGridItems(items, columnCount, isFullWidth)

  function handleEndReached() {
    if (!hasNextPage || fetchInFlightRef.current) {
      return
    }

    fetchInFlightRef.current = true

    Promise.resolve(fetchNextPage()).finally(() => {
      fetchInFlightRef.current = false
    })
  }

  function renderRow(index: number, row: VirtualMangaGridRow<TItem>) {
    if (row.type === 'full') {
      return renderItem(row.item, row.itemIndex)
    }

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

  // Virtuoso의 imperative handle은 언마운트 시점(useEffect cleanup)에 이미 detach되므로
  // 스크롤 상태는 인스턴스가 살아있는 동안(스크롤 중·pagehide) throttled로 저장해요.
  useEffect(() => {
    const storageKey = createScrollRestorationStorageKey(identity, columnCount)

    function saveSnapshot() {
      virtuosoRef.current?.getState((snapshot) => writeScrollSnapshot(storageKey, snapshot))
    }

    let throttleId: number | undefined

    function handleScroll() {
      if (throttleId !== undefined) {
        return
      }

      throttleId = window.setTimeout(() => {
        throttleId = undefined
        saveSnapshot()
      }, SCROLL_SNAPSHOT_THROTTLE_MS)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pagehide', saveSnapshot)

    return () => {
      window.clearTimeout(throttleId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pagehide', saveSnapshot)
    }
  }, [columnCount, identity])

  return (
    <Virtuoso<VirtualMangaGridRow<TItem>, GridContext>
      components={GRID_COMPONENTS}
      computeItemKey={getRowKey}
      context={{ footer, header }}
      data={rows}
      endReached={handleEndReached}
      increaseViewportBy={VIEWPORT_OVERSCAN_PX}
      itemContent={renderRow}
      ref={virtuosoRef}
      restoreStateFrom={restoreState}
      useWindowScroll
    />
  )
}

const GRID_COMPONENTS = {
  Footer: ({ context }: { context?: GridContext }) => {
    return <>{context?.footer}</>
  },
  Header: ({ context }: { context?: GridContext }) => {
    return <>{context?.header}</>
  },
}

function getRowKey<TItem extends VirtualMangaGridItem>(index: number, row: VirtualMangaGridRow<TItem>) {
  if (row.type === 'full') {
    return String(row.item.key)
  }

  return String(row.items[0]?.item.key ?? index)
}

function createScrollRestorationStorageKey(identity: string, columnCount: number) {
  return `virtual-scroll:${identity}:c${columnCount}`
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
