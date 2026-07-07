'use client'

import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { twMerge } from 'tailwind-merge'

import { JUICY_ADS_BANNER_ID } from './constants'
import JuicyAdsScript from './JuicyAdsScript'
import JuicyAdsSlot from './JuicyAdsSlot'
import { DEFAULT_AD_LAYOUT } from './layouts'
import type { JuicyAdsLayoutNode } from './types'

type Props = {
  className?: string
  title?: ReactNode
  layout?: readonly JuicyAdsLayoutNode[]
  onAdClick?: () => void
}

export default function JuicyAdsBanner({ className, title, layout, onAdClick }: Props) {
  return (
    <section className={twMerge('flex flex-col gap-2', className)}>
      {title && <div className="text-center text-xs text-zinc-400 font-medium">{title}</div>}
      <JuicyAdsScript />
      <div className="flex flex-wrap justify-center gap-1.5 self-stretch" id={JUICY_ADS_BANNER_ID}>
        {renderLayoutNodes(layout ?? DEFAULT_AD_LAYOUT, onAdClick)}
      </div>
    </section>
  )
}

function renderLayoutNode(node: JuicyAdsLayoutNode, key: string, onAdClick?: () => void) {
  if (node.type === 'slot') {
    return (
      <JuicyAdsSlot
        adSlotId={node.slot.id}
        className={node.className}
        height={node.slot.height}
        key={key}
        onAdClick={onAdClick ? () => onAdClick() : undefined}
        width={node.slot.width}
        zoneId={node.slot.zoneId}
      />
    )
  }

  const children = renderLayoutNodes(node.children, onAdClick, key)

  if (!node.className) {
    return <Fragment key={key}>{children}</Fragment>
  }

  return (
    <div className={twMerge(node.className)} key={key}>
      {children}
    </div>
  )
}

function renderLayoutNodes(layout: readonly JuicyAdsLayoutNode[], onAdClick?: () => void, path = 'layout') {
  return layout.map((node, index) => renderLayoutNode(node, `${path}-${index}`, onAdClick))
}
