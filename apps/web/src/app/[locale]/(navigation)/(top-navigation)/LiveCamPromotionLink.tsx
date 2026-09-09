'use client'

import { Webcam } from 'lucide-react'
import { useTranslations } from 'next-intl'

import useGAViewEvent from '@/hook/useGAViewEvent'
import { track } from '@/lib/analytics/browser'
import { createPromotionEventParams } from '@/lib/analytics/promotion'

import { topNavigationActionClassName } from './topNavigationActionConfig'

const LIVE_CAM_AD_URL =
  'https://go.mayzaent.com/easy?campaignId=9d20b0e1cdc5d8f431284a7a4770b95bd86895005a5c5fed752274c9c358439d&userId=aa4758cfc7c43c51b566cfe94b70d526647e75bdcc7256792426df97f7d809ac&p1=litomi'

export default function LiveCamPromotionLink() {
  const t = useTranslations('TopNavigation.actions')

  const promotionParams = createPromotionEventParams({
    creative_name: 'top-navigation-button',
    creative_slot: 'top-navigation',
    promotion_id: 'live-cam-top-navigation',
    promotion_name: '라이브 캠',
  })

  const { ref } = useGAViewEvent({
    cooldownKey: 'live-cam-top-navigation:top-navigation-button',
    eventName: 'view_promotion',
    eventParams: promotionParams,
  })

  return (
    <a
      className={`${topNavigationActionClassName} shrink-0 whitespace-nowrap`}
      href={LIVE_CAM_AD_URL}
      onClick={() => track('select_promotion', promotionParams)}
      ref={ref}
      rel="noopener sponsored"
      target="_blank"
    >
      <Webcam aria-hidden className="size-5 hidden sm:block" />
      {t('liveCam')}
    </a>
  )
}
