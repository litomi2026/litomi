'use client'

import type { GETV1MeResponse } from '@litomi/contracts'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Fragment } from 'react'
import { twMerge } from 'tailwind-merge'

import LoginPageLink from '@/components/LoginPageLink'
import useMounted from '@/hook/useMounted'
import { Link } from '@/i18n/navigation'
import useMeQuery from '@/query/useMeQuery'
import { shouldShowAds } from '@/utils/adult-verification'
import { JUICY_ADS_BANNER_ID } from './constants'
import JuicyAdsScript from './JuicyAdsScript'
import JuicyAdsSlot from './JuicyAdsSlot'
import { DEFAULT_NON_ADULT_AD_LAYOUT } from './layouts'
import type { JuicyAdsLayoutNode } from './types'

type Props = {
  className?: string
  title?: ReactNode
  layout?: readonly JuicyAdsLayoutNode[]
  onAdClick?: () => void
}

export default function JuicyAdsBanner({ className, title, layout, onAdClick }: Props) {
  const isMounted = useMounted()
  const { data: me } = useMeQuery()
  const adsVisible = isMounted && shouldShowAds(me)

  if (!adsVisible) {
    return null
  }

  return (
    <section className={twMerge('flex flex-col gap-2', className)}>
      <div className="text-center text-xs text-zinc-400 font-medium">{title || <DefaultTitle me={me} />}</div>
      <JuicyAdsScript />
      <div className="flex flex-wrap justify-center gap-1.5 self-stretch" id={JUICY_ADS_BANNER_ID}>
        {renderLayoutNodes(layout ?? DEFAULT_NON_ADULT_AD_LAYOUT, onAdClick)}
      </div>
    </section>
  )
}

function DefaultTitle({ me }: { me?: GETV1MeResponse | null }) {
  const t = useTranslations('Common.ads')

  return (
    <>
      {me ? (
        <Link className="font-bold text-foreground p-2 -m-2" href="/settings#adult">
          {t('action')}
        </Link>
      ) : (
        <LoginPageLink className="text-foreground">{t('actionGuest')}</LoginPageLink>
      )}
      {t('suffix')}
    </>
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
