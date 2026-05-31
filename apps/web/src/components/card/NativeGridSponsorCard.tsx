'use client'

import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'

import { View } from '@litomi/std'
import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type CSSProperties, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import useGAViewEvent from '@/hook/useGAViewEvent'
import { track } from '@/lib/analytics/browser'
import { createPromotionEventParams } from '@/lib/analytics/promotion'

type Props = {
  className?: string
  sponsor: NativeGridSponsor
  variant?: View
}

const IMAGE_FRAME_CLASS_NAMES = {
  [View.CARD]: 'aspect-4/3',
  [View.IMAGE]: 'aspect-5/7',
} as const

type NativeGridSponsorCardStyle = CSSProperties &
  Record<
    | '--native-grid-sponsor-accent'
    | '--native-grid-sponsor-background'
    | '--native-grid-sponsor-border'
    | '--native-grid-sponsor-cta-background'
    | '--native-grid-sponsor-cta-border'
    | '--native-grid-sponsor-cta-hover-background'
    | '--native-grid-sponsor-foreground'
    | '--native-grid-sponsor-image-background'
    | '--native-grid-sponsor-label-background'
    | '--native-grid-sponsor-muted'
    | '--native-grid-sponsor-ring',
    string
  >

type SponsorDisclosureKey = 'disclosure' | 'publicAd' | 'publicCampaign'

export default function NativeGridSponsorCard({ className, sponsor, variant = View.CARD }: Props) {
  const [imageIndex, setImageIndex] = useState(0)
  const t = useTranslations('Common.mangaCard.sponsor')

  const imageCount = sponsor.imageUrls.length
  const activeImageIndex = imageCount > 0 ? imageIndex % imageCount : 0
  const imageUrl = sponsor.imageUrls[activeImageIndex]
  const disclosureLabel = getDisclosureLabel(sponsor.label, t)
  const advertiserLabel = sponsor.advertiserName?.trim()
  const ctaLabel = sponsor.ctaLabel?.trim() || t('cta')
  const sponsorContextLabel = [disclosureLabel, advertiserLabel].filter(Boolean).join(', ')
  const imageLinkLabel = t('imageLinkLabel', { context: sponsorContextLabel, title: sponsor.title })
  const sponsorLinkLabel = t('sponsorLinkLabel', { context: sponsorContextLabel, title: sponsor.title })
  const viewEventCooldownKey = `${sponsor.id}:${sponsor.placementId}:${sponsor.creativeId}`
  const theme = sponsor.theme

  const themeStyle: NativeGridSponsorCardStyle = {
    '--native-grid-sponsor-accent': theme?.accentColor ?? 'var(--color-brand)',
    '--native-grid-sponsor-background': theme?.backgroundColor ?? 'var(--color-zinc-900)',
    '--native-grid-sponsor-foreground': theme?.foregroundColor ?? 'var(--color-foreground)',
    '--native-grid-sponsor-muted': theme?.mutedColor ?? 'var(--color-zinc-400)',
    '--native-grid-sponsor-border': 'color-mix(in oklab, var(--native-grid-sponsor-accent) 20%, var(--color-zinc-800))',
    '--native-grid-sponsor-cta-background': 'color-mix(in oklab, var(--native-grid-sponsor-accent) 10%, transparent)',
    '--native-grid-sponsor-cta-border': 'color-mix(in oklab, var(--native-grid-sponsor-accent) 30%, transparent)',
    '--native-grid-sponsor-cta-hover-background':
      'color-mix(in oklab, var(--native-grid-sponsor-accent) 15%, transparent)',
    '--native-grid-sponsor-image-background': 'color-mix(in oklab, var(--native-grid-sponsor-background) 82%, black)',
    '--native-grid-sponsor-label-background': 'color-mix(in oklab, var(--native-grid-sponsor-background) 88%, black)',
    '--native-grid-sponsor-ring': 'color-mix(in oklab, var(--native-grid-sponsor-accent) 20%, transparent)',
  }

  const { ref: cardRef } = useGAViewEvent({
    cooldownKey: viewEventCooldownKey,
    eventName: 'view_promotion',
    eventParams: createPromotionEventParams({
      campaign_id: sponsor.campaignId,
      creative_id: sponsor.creativeId,
      creative_name: 'native-grid-card',
      creative_slot: sponsor.placementId,
      itemIndex: sponsor.position,
      promotion_id: sponsor.id,
      promotion_name: sponsor.title,
    }),
  })

  function handleSponsorClick() {
    track(
      'select_promotion',
      createPromotionEventParams({
        campaign_id: sponsor.campaignId,
        creative_id: sponsor.creativeId,
        creative_name: 'native-grid-card',
        creative_slot: sponsor.placementId,
        itemIndex: sponsor.position,
        promotion_id: sponsor.id,
        promotion_name: sponsor.title,
      }),
    )
  }

  useEffect(() => {
    setImageIndex(0)
  }, [sponsor.creativeId, imageCount])

  return (
    <article
      className={twMerge(
        'group flex h-full flex-col overflow-hidden rounded-xl border-2 border-(--native-grid-sponsor-border) bg-(--native-grid-sponsor-background) text-(--native-grid-sponsor-foreground) transition hover:border-(--native-grid-sponsor-accent) focus-within:border-(--native-grid-sponsor-accent) focus-within:ring-2 focus-within:ring-(--native-grid-sponsor-ring)',
        className,
      )}
      ref={cardRef}
      style={themeStyle}
    >
      <div
        className={twMerge(
          'relative overflow-hidden bg-(--native-grid-sponsor-image-background)',
          IMAGE_FRAME_CLASS_NAMES[variant],
        )}
      >
        <a
          aria-label={imageLinkLabel}
          className="block size-full focus:outline-none"
          href={sponsor.targetUrl}
          onClick={handleSponsorClick}
          rel="sponsored noopener noreferrer"
          target="_blank"
        >
          <img
            alt={sponsor.title}
            className="size-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={imageUrl}
          />
        </a>
        <div className="pointer-events-none absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md bg-(--native-grid-sponsor-label-background) px-2 py-1 text-xs font-semibold text-(--native-grid-sponsor-foreground) shadow-sm ring-1 ring-white/10 backdrop-blur">
          <span className="shrink-0 text-(--native-grid-sponsor-accent)">{disclosureLabel}</span>
          {advertiserLabel && (
            <span className="min-w-0 truncate text-(--native-grid-sponsor-muted)">{advertiserLabel}</span>
          )}
        </div>
        {imageCount > 1 && (
          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-zinc-950/60 px-1.5 py-1 shadow-sm ring-1 ring-white/10 backdrop-blur">
            {sponsor.imageUrls.map((url, index) => (
              <button
                aria-current={index === activeImageIndex ? 'true' : undefined}
                aria-label={t('imageIndexLabel', { count: imageCount, index: index + 1, title: sponsor.title })}
                className={twMerge(
                  'h-1.5 w-1.5 rounded-full bg-white/45 transition-[width,background-color] hover:bg-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--native-grid-sponsor-accent)',
                  index === activeImageIndex && 'w-4 bg-white/90',
                )}
                key={`${url}-${index}`}
                onClick={() => setImageIndex(index)}
                type="button"
              />
            ))}
          </div>
        )}
      </div>
      {variant === View.CARD && (
        <a
          aria-label={sponsorLinkLabel}
          className="flex grow flex-col justify-between gap-3 border-t-2 border-(--native-grid-sponsor-border) p-3 focus:outline-none"
          href={sponsor.targetUrl}
          onClick={handleSponsorClick}
          rel="sponsored noopener noreferrer"
          target="_blank"
        >
          <div className="grid gap-2">
            <h3 className="line-clamp-2 wrap-break-word text-base font-bold leading-5 text-(--native-grid-sponsor-foreground)">
              {sponsor.title}
            </h3>
            <p className="line-clamp-3 wrap-break-word text-sm leading-6 text-(--native-grid-sponsor-muted)">
              {sponsor.description}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-(--native-grid-sponsor-cta-border) bg-(--native-grid-sponsor-cta-background) px-2.5 py-2 text-sm font-bold text-(--native-grid-sponsor-accent) transition group-hover:bg-(--native-grid-sponsor-cta-hover-background)">
            <span className="min-w-0 truncate">{ctaLabel}</span>
            <ExternalLink aria-hidden className="size-4 shrink-0" />
          </div>
        </a>
      )}
    </article>
  )
}

function getDisclosureLabel(label: string, t: (key: SponsorDisclosureKey) => string) {
  const trimmedLabel = label.trim()

  switch (trimmedLabel) {
    case '':
    case '광고':
      return t('disclosure')
    case '공익 광고':
      return t('publicAd')
    case '공익 캠페인':
      return t('publicCampaign')
    default:
      return trimmedLabel
  }
}
