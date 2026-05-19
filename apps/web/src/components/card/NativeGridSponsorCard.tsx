'use client'

import type { NativeGridSponsor } from '@litomi/domain/sponsor/native-grid'

import { View } from '@litomi/std'
import { ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import useGAViewEvent from '@/hook/useGAViewEvent'
import { track } from '@/lib/analytics/browser'

type Props = {
  className?: string
  sponsor: NativeGridSponsor
  variant?: View
}

const IMAGE_FRAME_CLASS_NAMES = {
  [View.CARD]: 'aspect-4/3',
  [View.IMAGE]: 'aspect-5/7',
} as const

export default function NativeGridSponsorCard({ className, sponsor, variant = View.CARD }: Props) {
  const pathname = usePathname()
  const imageCount = sponsor.imageUrls.length
  const [imageIndex, setImageIndex] = useState(0)

  const activeImageIndex = imageCount > 0 ? imageIndex % imageCount : 0
  const imageUrl = sponsor.imageUrls[activeImageIndex]
  const disclosureLabel = sponsor.label.trim() || '광고'
  const advertiserLabel = sponsor.advertiserName?.trim()
  const sponsorContextLabel = [disclosureLabel, advertiserLabel].filter(Boolean).join(', ')
  const imageLinkLabel = `${sponsorContextLabel}: ${sponsor.title} 이미지 열기, 새 탭에서 열림`
  const sponsorLinkLabel = `${sponsorContextLabel}: ${sponsor.title} 광고주 사이트 열기, 새 탭에서 열림`

  const { ref: cardRef } = useGAViewEvent({
    eventName: 'view_promotion',
    eventParams: {
      campaign_id: sponsor.campaignId,
      creative_id: sponsor.creativeId,
      creative_name: 'native_grid_card',
      creative_slot: sponsor.placementId,
      location_id: pathname,
      promotion_id: sponsor.id,
      promotion_name: sponsor.title,
      slot_position: String(sponsor.position + 1),
    },
  })

  useEffect(() => {
    setImageIndex(0)
  }, [sponsor.creativeId, imageCount])

  function handleSponsorClick() {
    track('select_promotion', {
      campaign_id: sponsor.campaignId,
      creative_id: sponsor.creativeId,
      creative_name: 'native_grid_card',
      creative_slot: sponsor.placementId,
      destination: sponsor.targetUrl,
      location_id: pathname,
      promotion_id: sponsor.id,
      promotion_name: sponsor.title,
      slot_position: String(sponsor.position + 1),
    })
  }

  return (
    <article
      className={twMerge(
        'group flex h-full flex-col overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-900 transition hover:border-brand/50 focus-within:border-brand/70 focus-within:ring-2 focus-within:ring-brand/20',
        className,
      )}
      ref={cardRef}
    >
      <div className={twMerge('relative overflow-hidden bg-zinc-950', IMAGE_FRAME_CLASS_NAMES[variant])}>
        <a
          aria-label={imageLinkLabel}
          className="block size-full focus:outline-none"
          href={sponsor.targetUrl}
          onClick={handleSponsorClick}
          rel="sponsored noopener noreferrer"
          target="_blank"
        >
          <img alt={sponsor.title} className="size-full object-contain" loading="lazy" src={imageUrl} />
        </a>
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md bg-zinc-950/85 px-2 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-white/10 backdrop-blur">
          <span className="shrink-0 text-brand">{disclosureLabel}</span>
          {advertiserLabel && <span className="min-w-0 truncate text-zinc-300">{advertiserLabel}</span>}
        </div>
        {imageCount > 1 && (
          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-zinc-950/60 px-1.5 py-1 shadow-sm ring-1 ring-white/10 backdrop-blur">
            {sponsor.imageUrls.map((url, index) => (
              <button
                aria-current={index === activeImageIndex ? 'true' : undefined}
                aria-label={`${sponsor.title} 광고 이미지 ${index + 1}/${imageCount} 보기`}
                className={twMerge(
                  'h-1.5 w-1.5 rounded-full bg-white/45 transition-[width,background-color] hover:bg-white/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
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
      <a
        aria-label={sponsorLinkLabel}
        className="flex grow flex-col justify-between gap-3 border-t-2 border-zinc-800 p-3 focus:outline-none"
        href={sponsor.targetUrl}
        onClick={handleSponsorClick}
        rel="sponsored noopener noreferrer"
        target="_blank"
      >
        <div className="grid gap-2">
          <h3 className="line-clamp-2 wrap-break-word text-base font-bold leading-5 text-foreground">
            {sponsor.title}
          </h3>
          <p className="line-clamp-3 wrap-break-word text-sm leading-6 text-zinc-400">{sponsor.description}</p>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-2 text-sm font-bold text-brand transition group-hover:bg-brand/15">
          <span className="min-w-0 truncate">사이트 열기</span>
          <ExternalLink aria-hidden className="size-4 shrink-0" />
        </div>
      </a>
    </article>
  )
}
