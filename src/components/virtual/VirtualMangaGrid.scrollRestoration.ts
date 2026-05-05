'use client'

import type { ListImperativeAPI } from 'react-window'

import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useIsomorphicLayoutEffect } from '@/hook/useIsomorphicLayoutEffect'

const ROW_INDEX_ATTRIBUTE = 'data-virtual-manga-row-index'
const STORAGE_PREFIX = 'manga-grid-scroll'
const RESTORE_MAX_DURATION_MS = 1200
const RESTORE_STABLE_FRAME_COUNT = 6
const SCROLL_SNAPSHOT_SAVE_INTERVAL_MS = 250

export type VirtualMangaGridScrollAnchor = {
  itemKey: string
  rowIndex: number
}

type Options = {
  anchors: readonly VirtualMangaGridScrollAnchor[]
  list: ListImperativeAPI | null
  restorationKey: string
}

type VirtualMangaGridScrollSnapshot = {
  itemKey: string | null
  itemOffset: number
  scrollTop: number
}

export function useVirtualMangaGridScrollRestoration({ anchors, list, restorationKey }: Options) {
  const latestSnapshotRef = useRef<VirtualMangaGridScrollSnapshot | null>(null)
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
    (snapshot: VirtualMangaGridScrollSnapshot | null) => {
      if (!snapshot) {
        return
      }

      latestSnapshotRef.current = snapshot
      writeVirtualMangaGridScrollSnapshot(storageKey, snapshot)
    },
    [storageKey],
  )

  const saveScrollSnapshot = useCallback(
    (targetElement?: HTMLElement | null) => {
      const snapshot = targetElement
        ? getVirtualMangaGridScrollSnapshot(targetElement, getItemKeyByRowIndex)
        : latestSnapshotRef.current

      saveSnapshot(snapshot)
    },
    [getItemKeyByRowIndex, saveSnapshot],
  )

  useEffect(() => {
    latestSnapshotRef.current = null
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
      latestSnapshotRef.current = getVirtualMangaGridScrollSnapshot(element, getItemKeyByRowIndex)
    }

    function saveNowFromElement() {
      lastSavedAt = Date.now()
      saveSnapshot(getVirtualMangaGridScrollSnapshot(element, getItemKeyByRowIndex))
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
      saveSnapshot(latestSnapshotRef.current)
      element.removeEventListener('scroll', scheduleSave)
      window.removeEventListener('pagehide', saveNowFromElement)
    }
  }, [getItemKeyByRowIndex, saveSnapshot, scrollElement, storageKey])

  useIsomorphicLayoutEffect(() => {
    if (restoredStorageKeyRef.current === storageKey) {
      return
    }

    const snapshot = readVirtualMangaGridScrollSnapshot(storageKey)

    if (!snapshot) {
      restoredStorageKeyRef.current = storageKey
      return
    }

    const element = scrollElement

    if (!list || !element) {
      return
    }

    restoredStorageKeyRef.current = storageKey

    function getRowIndexByItemKey(itemKey: string) {
      return rowIndexByItemKey.get(itemKey) ?? null
    }

    return restoreVirtualMangaGridScrollSnapshot({ element, getRowIndexByItemKey, list, snapshot })
  }, [list, rowIndexByItemKey, scrollElement, storageKey])

  return { saveScrollSnapshot }
}

function getFirstVisibleVirtualMangaGridRow(element: HTMLElement) {
  const scrollTop = Math.max(0, element.scrollTop)
  const rows = element.querySelectorAll<HTMLElement>(`[${ROW_INDEX_ATTRIBUTE}]`)

  for (const row of rows) {
    const index = getVirtualMangaGridRowIndex(row)

    if (index === null) {
      continue
    }

    const top = getVirtualMangaGridRowTop(row)
    const height = getVirtualMangaGridRowHeight(row)

    if (top + height > scrollTop) {
      return { index, top }
    }
  }

  return null
}

function getVirtualMangaGridRow(element: HTMLElement, rowIndex: number) {
  return element.querySelector<HTMLElement>(`[${ROW_INDEX_ATTRIBUTE}="${rowIndex}"]`)
}

function getVirtualMangaGridRowHeight(row: HTMLElement) {
  return row.offsetHeight || row.getBoundingClientRect().height
}

function getVirtualMangaGridRowIndex(row: HTMLElement) {
  const index = Number(row.getAttribute(ROW_INDEX_ATTRIBUTE))
  return Number.isSafeInteger(index) && index >= 0 ? index : null
}

function getVirtualMangaGridRowTop(row: HTMLElement) {
  return parseTranslateYPixelValue(row.style.transform) ?? row.offsetTop
}

function getVirtualMangaGridScrollSnapshot(
  element: HTMLElement,
  getItemKeyByRowIndex: (rowIndex: number) => string | null,
): VirtualMangaGridScrollSnapshot {
  const scrollTop = Math.max(0, element.scrollTop)
  const row = getFirstVisibleVirtualMangaGridRow(element)

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

function parseVirtualMangaGridScrollSnapshot(raw: string | null): VirtualMangaGridScrollSnapshot | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<VirtualMangaGridScrollSnapshot>
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

function readVirtualMangaGridScrollSnapshot(storageKey: string) {
  try {
    return parseVirtualMangaGridScrollSnapshot(window.sessionStorage.getItem(storageKey))
  } catch {
    return null
  }
}

function restoreVirtualMangaGridScrollSnapshot({
  element,
  getRowIndexByItemKey,
  list,
  snapshot,
}: {
  element: HTMLElement
  getRowIndexByItemKey: (itemKey: string) => number | null
  list: ListImperativeAPI
  snapshot: VirtualMangaGridScrollSnapshot
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

    const row = getVirtualMangaGridRow(element, rowIndex)

    if (!row) {
      return null
    }

    return Math.max(0, getVirtualMangaGridRowTop(row) + snapshot.itemOffset)
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

function writeVirtualMangaGridScrollSnapshot(storageKey: string, snapshot: VirtualMangaGridScrollSnapshot) {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(snapshot))
  } catch {
    // Storage quota or browser privacy settings should not break navigation.
  }
}
