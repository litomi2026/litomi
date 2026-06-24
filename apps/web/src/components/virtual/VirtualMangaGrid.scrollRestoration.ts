'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ListImperativeAPI } from 'react-window'

import { useIsomorphicLayoutEffect } from '@/hook/useIsomorphicLayoutEffect'

const ROW_INDEX_ATTRIBUTE = 'data-virtual-row-index'
const STORAGE_PREFIX = 'virtual-scroll'
const RESTORE_MAX_DURATION_MS = 1200
const RESTORE_STABLE_FRAME_COUNT = 6
const SCROLL_SNAPSHOT_SAVE_INTERVAL_MS = 250

export type VirtualScrollAnchor = {
  itemKey: string
  rowIndex: number
}

type Options = {
  anchors: readonly VirtualScrollAnchor[]
  list: ListImperativeAPI | null
  restorationKey: string
}

type VirtualScrollSnapshot = {
  itemKey: string | null
  itemOffset: number
  scrollTop: number
}

export function useVirtualScrollRestoration({ anchors, list, restorationKey }: Options) {
  const pendingSnapshotRef = useRef<VirtualScrollSnapshot | null>(null)
  const restoredStorageKeyRef = useRef<string | null>(null)

  const scrollElement = list?.element ?? null
  const storageKey = `${STORAGE_PREFIX}:${restorationKey}`

  const { itemKeyByRowIndex, rowIndexByItemKey } = useMemo(() => {
    const nextItemKeyByRowIndex = new Map<number, string>()
    const nextRowIndexByItemKey = new Map<string, number>()

    for (const { itemKey, rowIndex } of anchors) {
      if (!nextItemKeyByRowIndex.has(rowIndex)) {
        nextItemKeyByRowIndex.set(rowIndex, itemKey)
      }

      nextRowIndexByItemKey.set(itemKey, rowIndex)
    }

    return {
      itemKeyByRowIndex: nextItemKeyByRowIndex,
      rowIndexByItemKey: nextRowIndexByItemKey,
    }
  }, [anchors])

  const getItemKeyByRowIndex = useCallback(
    (rowIndex: number) => itemKeyByRowIndex.get(rowIndex) ?? null,
    [itemKeyByRowIndex],
  )

  const saveSnapshot = useCallback(
    (snapshot: VirtualScrollSnapshot | null) => {
      if (!snapshot) {
        return
      }

      pendingSnapshotRef.current = snapshot
      writeVirtualScrollSnapshot(storageKey, snapshot)
    },
    [storageKey],
  )

  const saveScrollSnapshot = useCallback(
    (targetElement: HTMLElement) => saveSnapshot(getVirtualScrollSnapshot(targetElement, getItemKeyByRowIndex)),
    [getItemKeyByRowIndex, saveSnapshot],
  )

  useEffect(() => {
    pendingSnapshotRef.current = null
  }, [storageKey])

  useEffect(() => {
    if (!scrollElement) {
      return
    }

    const element = scrollElement
    let animationFrameId: number | null = null
    let lastSavedAt = 0
    let timeoutId: number | null = null

    function cancelScheduledSave() {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    function captureLatestSnapshot() {
      pendingSnapshotRef.current = getVirtualScrollSnapshot(element, getItemKeyByRowIndex)
    }

    function saveNowFromElement() {
      lastSavedAt = Date.now()
      saveSnapshot(getVirtualScrollSnapshot(element, getItemKeyByRowIndex))
    }

    function scheduleSave() {
      captureLatestSnapshot()

      if (animationFrameId !== null) {
        return
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null

        const delay = Math.max(0, SCROLL_SNAPSHOT_SAVE_INTERVAL_MS - (Date.now() - lastSavedAt))

        if (delay <= 0) {
          saveNowFromElement()
          return
        }

        if (timeoutId !== null) {
          return
        }

        timeoutId = window.setTimeout(() => {
          timeoutId = null
          saveNowFromElement()
        }, delay)
      })
    }

    element.addEventListener('scroll', scheduleSave, { passive: true })
    window.addEventListener('pagehide', saveNowFromElement)

    return () => {
      cancelScheduledSave()
      saveSnapshot(pendingSnapshotRef.current)
      element.removeEventListener('scroll', scheduleSave)
      window.removeEventListener('pagehide', saveNowFromElement)
    }
  }, [getItemKeyByRowIndex, saveSnapshot, scrollElement, storageKey])

  useIsomorphicLayoutEffect(() => {
    if (restoredStorageKeyRef.current === storageKey) {
      return
    }

    const snapshot = readVirtualScrollSnapshot(storageKey)

    if (!snapshot) {
      restoredStorageKeyRef.current = storageKey
      return
    }

    const element = scrollElement

    if (!list || !element) {
      return
    }

    restoredStorageKeyRef.current = storageKey

    return restoreVirtualScrollSnapshot({
      element,
      getRowIndexByItemKey: (itemKey: string) => rowIndexByItemKey.get(itemKey) ?? null,
      list,
      snapshot,
    })
  }, [list, rowIndexByItemKey, scrollElement, storageKey])

  return { saveScrollSnapshot }
}

function getFirstVisibleVirtualRow(element: HTMLElement) {
  const scrollTop = Math.max(0, element.scrollTop)
  const rows = element.querySelectorAll<HTMLElement>(`[${ROW_INDEX_ATTRIBUTE}]`)

  for (const row of rows) {
    const index = getVirtualRowIndex(row)

    if (index === null) {
      continue
    }

    const top = getVirtualRowTop(row)
    const height = getVirtualRowHeight(row)

    if (top + height > scrollTop) {
      return { index, top }
    }
  }

  return null
}

function getVirtualRow(element: HTMLElement, rowIndex: number) {
  return element.querySelector<HTMLElement>(`[${ROW_INDEX_ATTRIBUTE}="${rowIndex}"]`)
}

function getVirtualRowHeight(row: HTMLElement) {
  return row.offsetHeight || row.getBoundingClientRect().height
}

function getVirtualRowIndex(row: HTMLElement) {
  const index = Number(row.getAttribute(ROW_INDEX_ATTRIBUTE))
  return Number.isSafeInteger(index) && index >= 0 ? index : null
}

function getVirtualRowTop(row: HTMLElement) {
  return parseTranslateYPixelValue(row.style.transform) ?? row.offsetTop
}

function getVirtualScrollSnapshot(
  element: HTMLElement,
  getItemKeyByRowIndex: (rowIndex: number) => string | null,
): VirtualScrollSnapshot {
  const scrollTop = Math.max(0, element.scrollTop)
  const row = getFirstVisibleVirtualRow(element)

  return {
    itemKey: row ? getItemKeyByRowIndex(row.index) : null,
    itemOffset: row ? Math.max(0, scrollTop - row.top) : 0,
    scrollTop,
  }
}

function isSafeScrollNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function parseTranslateYPixelValue(value: string) {
  const match = /^translateY\((-?\d+(?:\.\d+)?)px\)$/.exec(value)

  if (!match) {
    return null
  }

  const parsed = Number.parseFloat(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

function parseVirtualScrollSnapshot(raw: string | null): VirtualScrollSnapshot | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VirtualScrollSnapshot>
    const itemKey = parsed.itemKey

    if (!isSafeScrollNumber(parsed.scrollTop) || !isSafeScrollNumber(parsed.itemOffset)) {
      return null
    }

    return {
      itemKey: typeof itemKey === 'string' && itemKey.length > 0 ? itemKey : null,
      itemOffset: parsed.itemOffset,
      scrollTop: parsed.scrollTop,
    }
  } catch {
    return null
  }
}

function readVirtualScrollSnapshot(storageKey: string) {
  try {
    return parseVirtualScrollSnapshot(window.sessionStorage.getItem(storageKey))
  } catch {
    return null
  }
}

function restoreVirtualScrollSnapshot({
  element,
  getRowIndexByItemKey,
  list,
  snapshot,
}: {
  element: HTMLElement
  getRowIndexByItemKey: (itemKey: string) => number | null
  list: ListImperativeAPI
  snapshot: VirtualScrollSnapshot
}) {
  const startedAt = performance.now()
  let frameId: number | null = null
  let isCancelled = false
  let lastAppliedTop: number | null = null
  let stableFrameCount = 0

  function cancelRestoration() {
    isCancelled = true

    if (frameId !== null) {
      window.cancelAnimationFrame(frameId)
      frameId = null
    }
  }

  function getAnchoredRowIndex() {
    return snapshot.itemKey === null ? null : getRowIndexByItemKey(snapshot.itemKey)
  }

  function getAnchoredScrollTop() {
    if (snapshot.itemKey === null) {
      return snapshot.scrollTop
    }

    const rowIndex = getAnchoredRowIndex()

    if (rowIndex === null) {
      return snapshot.scrollTop
    }

    const row = getVirtualRow(element, rowIndex)

    if (!row) {
      return null
    }

    return Math.max(0, getVirtualRowTop(row) + snapshot.itemOffset)
  }

  function scrollAnchorRowIntoView() {
    const rowIndex = getAnchoredRowIndex()

    if (rowIndex === null) {
      return
    }

    list.scrollToRow({ index: rowIndex })
  }

  function applyScroll() {
    const top = getAnchoredScrollTop()

    if (top === null) {
      scrollAnchorRowIntoView()
      return
    }

    element.scrollTo({ behavior: 'auto', top })

    stableFrameCount = lastAppliedTop === top ? stableFrameCount + 1 : 0
    lastAppliedTop = top
  }

  function scheduleApplyScroll() {
    if (isCancelled) {
      return
    }

    if (performance.now() - startedAt > RESTORE_MAX_DURATION_MS || stableFrameCount >= RESTORE_STABLE_FRAME_COUNT) {
      return
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = null
      applyScroll()
      scheduleApplyScroll()
    })
  }

  element.addEventListener('keydown', cancelRestoration, { once: true })
  element.addEventListener('pointerdown', cancelRestoration, { once: true, passive: true })
  element.addEventListener('wheel', cancelRestoration, { once: true, passive: true })

  scrollAnchorRowIntoView()
  applyScroll()
  scheduleApplyScroll()

  return () => {
    cancelRestoration()
    element.removeEventListener('keydown', cancelRestoration)
    element.removeEventListener('pointerdown', cancelRestoration)
    element.removeEventListener('wheel', cancelRestoration)
  }
}

function writeVirtualScrollSnapshot(storageKey: string, snapshot: VirtualScrollSnapshot) {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot))
  } catch {
    // Storage quota or browser privacy settings should not break navigation.
  }
}
