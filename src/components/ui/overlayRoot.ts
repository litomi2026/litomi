'use client'

let overlayRoot: HTMLDivElement | null = null

export function ensureOverlayRoot(): HTMLDivElement | null {
  if (typeof document === 'undefined') {
    return null
  }

  if (overlayRoot) {
    return overlayRoot
  }

  const el = document.createElement('div')
  el.dataset.overlayRoot = 'true'
  el.style.position = 'fixed'
  el.style.inset = '0'
  el.style.zIndex = '2147483647'
  el.style.pointerEvents = 'none'

  overlayRoot = el
  return overlayRoot
}

export function getOverlayRoot(): HTMLDivElement | null {
  return overlayRoot
}
