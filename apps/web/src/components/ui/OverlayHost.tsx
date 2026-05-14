'use client'

import { type ReactNode, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

import { ensureOverlayRoot } from '@/components/ui/overlayRoot'
import { useTopLayerPortalContainer } from '@/components/ui/topLayerPortal'

type Props = {
  children: ReactNode
}

export default function OverlayHost({ children }: Props) {
  const topLayerPortalContainer = useTopLayerPortalContainer()
  const overlayRoot = ensureOverlayRoot()

  useLayoutEffect(() => {
    if (!overlayRoot) {
      return
    }

    const target = topLayerPortalContainer ?? document.body
    if (overlayRoot.parentElement !== target) {
      target.appendChild(overlayRoot)
    }
  }, [overlayRoot, topLayerPortalContainer])

  if (!overlayRoot) {
    return null
  }

  return createPortal(children, overlayRoot)
}
