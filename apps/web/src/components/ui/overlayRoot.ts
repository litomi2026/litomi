'use client'

import { useLayoutEffect, useState } from 'react'

let overlayRoot: HTMLDivElement | null = null

export function useOverlayRoot(): HTMLDivElement | null {
  const [root, setRoot] = useState<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    setRoot(ensureOverlayRoot())
  }, [])

  return root
}

function ensureOverlayRoot(): HTMLDivElement {
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
