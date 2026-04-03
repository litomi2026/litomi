'use client'

import type { ReactNode } from 'react'

import Link from 'next/link'
import { Fragment } from 'react'
import { twMerge } from 'tailwind-merge'

import type { GETV1MeResponse } from '@/backend/api/v1/me/GET'

import LoginPageLink from '@/components/LoginPageLink'
import useMounted from '@/hook/useMounted'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, requiresAds } from '@/utils/adult-verification'

import type { JuicyAdsLayoutNode } from './types'

import { JUICY_ADS_BANNER_ID } from './constants'
import JuicyAdsScript from './JuicyAdsScript'
import JuicyAdsSlot from './JuicyAdsSlot'
import { DEFAULT_NON_ADULT_AD_LAYOUT } from './layouts'

type Props = {
  className?: string
  title?: ReactNode
  subtitle?: ReactNode
  layout?: readonly JuicyAdsLayoutNode[]
  onAdClick?: () => void
}

export default function NonAdultJuicyAdsBanner({
  className,
  title = '광고 수익은 서비스 운영에 사용돼요.',
  subtitle,
  layout,
  onAdClick,
}: Props) {
  const isMounted = useMounted()
  const { data: me } = useMeQuery()

  const status = getAdultState(me)
  const shouldShowAds = isMounted && requiresAds(status, me?.settings) && false

  if (!shouldShowAds) {
    return null
  }

  return (
    <section className={twMerge('flex flex-col gap-2', className)}>
      <div className="grid gap-1 text-center">
        <p className="text-sm text-zinc-300 font-medium">{title}</p>
        <p className="text-xs text-zinc-500">{subtitle || <DefaultSubtitle me={me} />}</p>
      </div>
      <JuicyAdsScript />
      <div className="flex flex-wrap justify-center gap-1.5 self-stretch" id={JUICY_ADS_BANNER_ID}>
        {renderLayoutNodes(layout ?? DEFAULT_NON_ADULT_AD_LAYOUT, onAdClick)}
      </div>
    </section>
  )
}

function DefaultSubtitle({ me }: { me?: GETV1MeResponse | null }) {
  return (
    <>
      {me ? (
        <Link className="font-bold text-zinc-400 p-2 -m-2" href={`/@${me.name}/settings#adult`}>
          익명 성인인증
        </Link>
      ) : (
        <LoginPageLink className="text-zinc-400">로그인 후 익명 성인인증</LoginPageLink>
      )}
      을 완료하면 광고는 자동으로 숨겨져요.
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
