'use client'

import { ShieldCheck } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import useGAViewEvent from '@/hook/useGAViewEvent'
import { track } from '@/lib/analytics/browser'
import { createPromotionEventParams } from '@/lib/analytics/promotion'

import { NORDVPN_URL, topNavigationActionClassName } from './topNavigationActionConfig'

export default function NordVPNPromotionLink() {
  const promotionParams = createPromotionEventParams({
    creative_name: 'top-navigation-button',
    creative_slot: 'top-navigation',
    promotion_id: 'nordvpn-top-navigation',
    promotion_name: 'NordVPN',
  })

  const { ref } = useGAViewEvent({
    cooldownKey: 'nordvpn-top-navigation:top-navigation-button',
    eventName: 'view_promotion',
    eventParams: promotionParams,
  })

  return (
    <a
      className={twMerge(topNavigationActionClassName, 'relative')}
      href={NORDVPN_URL}
      onClick={() => track('select_promotion', promotionParams)}
      ref={ref}
      rel="noopener noreferrer sponsored"
      target="_blank"
      title="NordVPN"
    >
      <ShieldCheck className="size-5" />
      <span className="hidden sm:inline">NordVPN</span>
    </a>
  )
}
