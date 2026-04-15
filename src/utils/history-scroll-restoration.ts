'use client'

const SCROLL_RESTORATION_HISTORY_KEY = 'scrollRestoration'
const SCROLL_RESTORATION_STORAGE_KEY = 'scrollRestore'
const SCROLL_RESTORATION_TTL_MS = 15_000

export const SCROLL_ANCHOR_SELECTOR = '[data-scroll-anchor="true"]'

export type ScrollRestorePosition = {
  anchorId: string | null
  anchorIndex: number | null
  anchorOffset: number
  scrollY: number
  timestamp: number
  url: string
}

type HistoryStateRecord = Record<string, unknown>

type ScrollAnchorMetadata = {
  anchorId: string | null
  anchorIndex: number | null
}

type ScrollRestoration = {
  at: number
  url: string
}

type ScrollRestorePositionMap = Record<string, ScrollRestorePosition>

export function clearScrollRestoration() {
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

export function createScrollRestorePosition(): ScrollRestorePosition | null {
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

export function findScrollAnchorForPosition(position: ScrollRestorePosition) {
  const anchors = getScrollAnchorElements()

  if (anchors.length === 0) {
    return null
  }

  let matchedById: HTMLElement | null = null

  for (const anchor of anchors) {
    const { anchorId, anchorIndex } = getScrollAnchorMetadata(anchor)

    if (position.anchorId && anchorId === position.anchorId) {
      if (position.anchorIndex == null || anchorIndex === position.anchorIndex) {
        return anchor
      }

      matchedById ??= anchor
    }
  }

  if (matchedById) {
    return matchedById
  }

  if (position.anchorIndex == null) {
    return null
  }

  return anchors.find((anchor) => getScrollAnchorMetadata(anchor).anchorIndex === position.anchorIndex) ?? null
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

export function getScrollAnchorDocumentTop(anchor: HTMLElement) {
  return window.scrollY + anchor.getBoundingClientRect().top
}

export function getScrollRestoreFromHistoryState(restoreKey: string) {
  return getScrollRestorePositionMap()[restoreKey] ?? null
}

export function getScrollRestoreFromStorage() {
  try {
    const raw = sessionStorage.getItem(SCROLL_RESTORATION_STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<ScrollRestoration> | null

    if (!parsed || typeof parsed !== 'object') {
      clearScrollRestoration()
      return null
    }

    if (typeof parsed.url !== 'string' || typeof parsed.at !== 'number') {
      clearScrollRestoration()
      return null
    }

    if (Date.now() - parsed.at > SCROLL_RESTORATION_TTL_MS) {
      clearScrollRestoration()
      return null
    }

    return parsed as ScrollRestoration
  } catch {
    clearScrollRestoration()
    return null
  }
}

export function setScrollRestoreInHistoryState(restoreKey: string, position: ScrollRestorePosition) {
  const currentPositions = getScrollRestorePositionMap()

  const newState = {
    ...getSafeHistoryState(window.history.state),
    [SCROLL_RESTORATION_HISTORY_KEY]: {
      ...currentPositions,
      [restoreKey]: position,
    },
  }

  window.history.replaceState(newState, '', window.location.href)
}

export function setScrollRestoreInStorage(url = getCurrentScrollRestoreUrl()) {
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

function getScrollRestorePositionMap() {
  const state = getSafeHistoryState(window.history.state)[SCROLL_RESTORATION_HISTORY_KEY]

  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return {}
  }

  const positionEntries = Object.entries(state)
  const positions: ScrollRestorePositionMap = {}

  for (const [restoreKey, position] of positionEntries) {
    if (!position || typeof position !== 'object' || Array.isArray(position)) {
      continue
    }

    const { anchorId, anchorIndex, anchorOffset, scrollY, timestamp, url } = position as Partial<ScrollRestorePosition>

    if (
      typeof url !== 'string' ||
      typeof scrollY !== 'number' ||
      typeof anchorOffset !== 'number' ||
      typeof timestamp !== 'number'
    ) {
      continue
    }

    positions[restoreKey] = {
      anchorId: typeof anchorId === 'string' ? anchorId : null,
      anchorIndex: typeof anchorIndex === 'number' ? anchorIndex : null,
      anchorOffset,
      scrollY,
      timestamp,
      url,
    }
  }

  return positions
}

function parseAnchorIndex(anchorIndex: string | undefined) {
  if (!anchorIndex) {
    return null
  }

  const parsed = Number.parseInt(anchorIndex, 10)

  return Number.isFinite(parsed) ? parsed : null
}
