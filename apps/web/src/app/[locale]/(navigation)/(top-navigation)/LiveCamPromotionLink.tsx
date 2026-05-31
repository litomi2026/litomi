'use client'

import { Webcam } from 'lucide-react'
import { useTranslations } from 'next-intl'

import useGAViewEvent from '@/hook/useGAViewEvent'
import { track } from '@/lib/analytics/browser'
import { createPromotionEventParams } from '@/lib/analytics/promotion'

import { LIVE_CAM_AD_URL, topNavigationActionClassName } from './topNavigationActionConfig'

export default function LiveCamPromotionLink() {
  const t = useTranslations('TopNavigation.actions')

  const promotionParams = createPromotionEventParams({
    creative_name: 'top-navigation-button',
    creative_slot: 'top-navigation',
    promotion_id: 'live-cam-top-navigation',
    promotion_name: '라이브 섹스 캠',
  })

  const { ref } = useGAViewEvent({
    cooldownKey: 'live-cam-top-navigation:top-navigation-button',
    eventName: 'view_promotion',
    eventParams: promotionParams,
  })

  return (
    <a
      className={topNavigationActionClassName}
      href={LIVE_CAM_AD_URL}
      onClick={() => track('select_promotion', promotionParams)}
      ref={ref}
      rel="noopener sponsored"
      target="_blank"
    >
      <Webcam className="size-5 hidden sm:block" />
      {t('liveCam')}
    </a>
  )
}
