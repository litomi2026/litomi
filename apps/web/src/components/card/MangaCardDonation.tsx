'use client'

import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import useGAViewEvent from '@/hook/useGAViewEvent'
import { track } from '@/lib/analytics/browser'
import { createPromotionEventParams } from '@/lib/analytics/promotion'

import LogoDiscord from '../icons/LogoDiscord'
import { MangaCardSkeleton } from './MangaCard'

export default function MangaCardDonation() {
  const t = useTranslations('Common.mangaCard.donationCard')

  const { ref: cardRef } = useGAViewEvent({
    eventName: 'view_promotion',
    eventParams: createPromotionEventParams({
      promotion_id: 'litomi-donation-card',
      promotion_name: '리토미 후원',
      creative_name: 'donation-card',
      creative_slot: 'content-feed',
    }),
  })

  function handlePromotionClick(creativeName: string) {
    track(
      'select_promotion',
      createPromotionEventParams({
        promotion_id: 'litomi-donation-card',
        promotion_name: '리토미 후원',
        creative_name: creativeName,
        creative_slot: 'content-feed',
      }),
    )
  }

  return (
    <MangaCardSkeleton className="aspect-auto">
      <div className="flex flex-col items-center gap-6 p-4 sm:p-6 text-center" ref={cardRef}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-brand/10 animate-pulse-ring" />
            <div className="relative p-3 rounded-full bg-zinc-800/50">
              <Heart className="size-6 fill-current text-brand animate-heartbeat" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t('title')}</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{t('description')}</p>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{t('socialLabel')}</span>
            <div className="flex flex-col gap-2">
              <a
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium"
                href="https://discord.gg/xTrbQaxpyD"
                onClick={() => handlePromotionClick('donation-card-discord')}
                rel="noopener"
                target="_blank"
              >
                <LogoDiscord className="size-4" />
                <span>{t('discordAction')}</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{t('donationLabel')}</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                className="p-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium text-center"
                href="https://patreon.com/litomi"
                onClick={() => handlePromotionClick('donation-card-patreon')}
                rel="noopener"
                target="_blank"
              >
                Patreon
              </a>
              <a
                className="py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium text-center"
                href="https://opencollective.com/litomi"
                onClick={() => handlePromotionClick('donation-card-open-collective')}
                rel="noopener"
                target="_blank"
              >
                open collective
              </a>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-500">{t('thanks')}</p>
      </div>
    </MangaCardSkeleton>
  )
}
