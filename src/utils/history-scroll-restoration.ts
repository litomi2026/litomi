'use client'

const SCROLL_RESTORATION_HISTORY_KEY = 'scrollRestoration'
const SCROLL_RESTORATION_STORAGE_KEY = 'pendingScrollRestore'
const PENDING_SCROLL_RESTORE_TTL_MS = 15_000

export const SCROLL_ANCHOR_SELECTOR = '[data-scroll-anchor="true"]'

export type ScrollRestoreSnapshot = {
  anchorId: string | null
  anchorIndex: number | null
  anchorOffset: number
  scrollY: number
  timestamp: number
  url: string
}

type HistoryStateRecord = Record<string, unknown>

type PendingScrollRestore = {
  at: number
  url: string
}

type ScrollAnchorMetadata = {
  anchorId: string | null
  anchorIndex: number | null
}

type ScrollRestoreStateMap = Record<string, ScrollRestoreSnapshot>

export function clearPendingHistoryScrollRestore() {
  try {
    sessionStorage.removeItem(SCROLL_RESTORATION_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function createScrollAnchorAttributes(anchorId: number | string, anchorIndex: number) {
  return {
    'data-manga-id': String(anchorId),
    'data-manga-index': String(anchorIndex),
    'data-scroll-anchor': 'true' as const,
  }
}

export function createScrollRestoreSnapshot(): ScrollRestoreSnapshot | null {
  const url = getCurrentScrollRestoreUrl()
  const scrollY = Math.round(window.scrollY)
  const anchor = getBestScrollAnchor()

  if (!anchor) {
    return scrollY > 0
      ? {
          anchorId: null,
          anchorIndex: null,
          anchorOffset: 0,
          scrollY,
          timestamp: Date.now(),
          url,
        }
      : null
  }

  const { anchorId, anchorIndex } = getScrollAnchorMetadata(anchor)
  const anchorDocumentTop = getScrollAnchorDocumentTop(anchor)

  return {
    anchorId,
    anchorIndex,
    anchorOffset: Math.round(scrollY - anchorDocumentTop),
    scrollY,
    timestamp: Date.now(),
    url,
  }
}

export function findScrollAnchorForSnapshot(snapshot: ScrollRestoreSnapshot) {
  const anchors = getScrollAnchorElements()

  if (anchors.length === 0) {
    return null
  }

  let matchedById: HTMLElement | null = null

  for (const anchor of anchors) {
    const { anchorId, anchorIndex } = getScrollAnchorMetadata(anchor)

    if (snapshot.anchorId && anchorId === snapshot.anchorId) {
      if (snapshot.anchorIndex == null || anchorIndex === snapshot.anchorIndex) {
        return anchor
      }

      matchedById ??= anchor
    }
  }

  if (matchedById) {
    return matchedById
  }

  if (snapshot.anchorIndex == null) {
    return null
  }

  return anchors.find((anchor) => getScrollAnchorMetadata(anchor).anchorIndex === snapshot.anchorIndex) ?? null
}

export function getBestScrollAnchor() {
  const anchors = getScrollAnchorElements()

  if (anchors.length === 0) {
    return null
  }

  const positionedAnchors = anchors
    .map((anchor) => ({ anchor, rect: anchor.getBoundingClientRect() }))
    .filter(({ rect }) => rect.bottom > 0 || rect.top < window.innerHeight)

  const candidates =
    positionedAnchors.length > 0
      ? positionedAnchors
      : anchors.map((anchor) => ({ anchor, rect: anchor.getBoundingClientRect() }))

  return candidates.reduce((best, current) => {
    return Math.abs(current.rect.top) < Math.abs(best.rect.top) ? current : best
  }).anchor
}

export function getCurrentScrollRestoreUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function getHistoryScrollRestoreSnapshot(restoreKey: string) {
  return getScrollRestoreStateMap()[restoreKey] ?? null
}

export function getPendingHistoryScrollRestore() {
  try {
    const raw = sessionStorage.getItem(SCROLL_RESTORATION_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<PendingScrollRestore> | null

    if (!parsed || typeof parsed !== 'object') {
      clearPendingHistoryScrollRestore()
      return null
    }

    if (typeof parsed.url !== 'string' || typeof parsed.at !== 'number') {
      clearPendingHistoryScrollRestore()
      return null
    }

    if (Date.now() - parsed.at > PENDING_SCROLL_RESTORE_TTL_MS) {
      clearPendingHistoryScrollRestore()
      return null
    }

    return parsed as PendingScrollRestore
  } catch {
    clearPendingHistoryScrollRestore()
    return null
  }
}

export function getScrollAnchorDocumentTop(anchor: HTMLElement) {
  return window.scrollY + anchor.getBoundingClientRect().top
}

export function setHistoryScrollRestoreSnapshot(restoreKey: string, snapshot: ScrollRestoreSnapshot) {
  const currentSnapshots = getScrollRestoreStateMap()

  const newState = {
    ...getSafeHistoryState(window.history.state),
    [SCROLL_RESTORATION_HISTORY_KEY]: {
      ...currentSnapshots,
      [restoreKey]: snapshot,
    },
  }

  window.history.replaceState(newState, '', window.location.href)
}

export function setPendingHistoryScrollRestore(url = getCurrentScrollRestoreUrl()) {
  try {
    sessionStorage.setItem(SCROLL_RESTORATION_STORAGE_KEY, JSON.stringify({ at: Date.now(), url }))
  } catch {
    // ignore
  }
}

function getSafeHistoryState(state: unknown): HistoryStateRecord {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return {}
  }

  return state as HistoryStateRecord
}

function getScrollAnchorElements() {
  return Array.from(document.querySelectorAll<HTMLElement>(SCROLL_ANCHOR_SELECTOR))
}

function getScrollAnchorMetadata(anchor: HTMLElement): ScrollAnchorMetadata {
  const anchorId = anchor.dataset.mangaId?.trim() || null
  const anchorIndex = parseAnchorIndex(anchor.dataset.mangaIndex)

  return {
    anchorId,
    anchorIndex,
  }
}

function getScrollRestoreStateMap() {
  const state = getSafeHistoryState(window.history.state)[SCROLL_RESTORATION_HISTORY_KEY]

  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return {}
  }

  const snapshotEntries = Object.entries(state)
  const snapshots: ScrollRestoreStateMap = {}

  for (const [restoreKey, snapshot] of snapshotEntries) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      continue
    }

    const { anchorId, anchorIndex, anchorOffset, scrollY, timestamp, url } = snapshot as Partial<ScrollRestoreSnapshot>

    if (
      typeof url !== 'string' ||
      typeof scrollY !== 'number' ||
      typeof anchorOffset !== 'number' ||
      typeof timestamp !== 'number'
    ) {
      continue
    }

    snapshots[restoreKey] = {
      anchorId: typeof anchorId === 'string' ? anchorId : null,
      anchorIndex: typeof anchorIndex === 'number' ? anchorIndex : null,
      anchorOffset,
      scrollY,
      timestamp,
      url,
    }
  }

  return snapshots
}

function parseAnchorIndex(anchorIndex: string | undefined) {
  if (!anchorIndex) {
    return null
  }

  const parsed = Number.parseInt(anchorIndex, 10)

  return Number.isFinite(parsed) ? parsed : null
}
