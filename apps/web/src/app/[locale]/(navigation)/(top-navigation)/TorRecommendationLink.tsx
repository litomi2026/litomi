'use client'

import { Waypoints } from 'lucide-react'
import { type MouseEvent, useEffect, useState } from 'react'

import useGAViewEvent from '@/hook/useGAViewEvent'
import { track } from '@/lib/analytics/browser'
import { createPromotionEventParams } from '@/lib/analytics/promotion'

import { topNavigationActionClassName, TOR_LINKS } from './topNavigationActionConfig'

type TorLink = (typeof TOR_LINKS)[keyof typeof TOR_LINKS]

export default function TorRecommendationLink() {
  const [link, setLink] = useState<TorLink | null>(null)

  const promotionParams = createPromotionEventParams({
    creative_name: 'top-navigation-button',
    creative_slot: 'top-navigation',
    promotion_id: 'tor-top-navigation',
    promotion_name: 'Tor',
  })

  const { ref } = useGAViewEvent({
    cooldownKey: 'tor-top-navigation:top-navigation-button',
    eventName: 'view_promotion',
    eventParams: promotionParams,
  })

  useEffect(() => {
    let isMounted = true

    resolveTorLink().then((nextLink) => {
      if (isMounted) {
        setLink(nextLink)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!link) {
      event.preventDefault()
      return
    }

    track('select_promotion', promotionParams)
  }

  return (
    <a
      aria-disabled={!link}
      aria-label={link?.label ?? 'Tor'}
      className={topNavigationActionClassName}
      href={link?.href}
      onClick={handleClick}
      ref={ref}
      rel="noopener noreferrer sponsored"
      target="_blank"
      title={link?.label ?? 'Tor'}
    >
      <Waypoints className="size-5" />
      <span className="hidden sm:inline">Tor</span>
    </a>
  )
}

async function checkBraveBrowser(): Promise<boolean> {
  const brave = (navigator as { brave?: { isBrave?: () => Promise<boolean> } }).brave

  if (!brave?.isBrave) {
    return false
  }

  try {
    return await brave.isBrave()
  } catch {
    return false
  }
}

function checkIOSDevice(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function checkMobileDevice(): boolean {
  const userAgentData = (navigator as { userAgentData?: { mobile?: boolean } }).userAgentData
  if (typeof userAgentData?.mobile === 'boolean') {
    return userAgentData.mobile
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)
}

async function resolveTorLink(): Promise<TorLink> {
  if (checkIOSDevice()) {
    return TOR_LINKS.onionBrowser
  }

  if (!checkMobileDevice() && (await checkBraveBrowser())) {
    return TOR_LINKS.braveBrowserTor
  }

  return TOR_LINKS.torBrowser
}
