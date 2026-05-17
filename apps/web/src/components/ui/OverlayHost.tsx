'use client'

import { useTopLayerPortalContainer } from '@litomi/ui'
import { type ReactNode, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

import { useOverlayRoot } from '@/components/ui/overlayRoot'

type Props = {
  children: ReactNode
}

export default function OverlayHost({ children }: Props) {
  const topLayerPortalContainer = useTopLayerPortalContainer()
  const overlayRoot = useOverlayRoot()

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
