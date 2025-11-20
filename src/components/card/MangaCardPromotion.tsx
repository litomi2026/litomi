'use client'

import { sendGAEvent } from '@next/third-parties/google'
import { ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'

import type { KeywordPromotion } from '@/sponsor'

import useGAViewEvent from '@/hook/useGAViewEvent'

type Props = {
  promotion: KeywordPromotion
}

export default function MangaCardPromotion({ promotion }: Props) {
  const pathname = usePathname()

  const { ref: cardRef } = useGAViewEvent({
    eventName: 'view_promotion',
    eventParams: {
      promotion_id: `keyword_promotion_${promotion.id}`,
      promotion_name: promotion.title,
      creative_name: 'promotion_card',
      creative_slot: 'search_results',
      location_id: pathname,
    },
  })

  function handlePromotionClick() {
    sendGAEvent('event', 'select_promotion', {
      promotion_id: `keyword_promotion_${promotion.id}`,
      promotion_name: promotion.title,
      creative_name: 'promotion_card',
      creative_slot: 'search_results',
      location_id: pathname,
      destination: promotion.url,
    })
  }

  return (
    <li className="relative" ref={cardRef}>
      <a
        className="block p-4 rounded-xl border-2 border-brand/40 bg-linear-to-br from-brand/5 to-transparent hover:border-brand/60 hover:from-brand/10 transition group"
        href={promotion.url}
        onClick={handlePromotionClick}
        rel="noopener"
        target="_blank"
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium text-brand/90 bg-brand/10 px-1.5 py-0.5 rounded">광고</span>
                {promotion.badge && (
                  <>
                    <span className="text-xs text-zinc-600">·</span>
                    <span className="text-xs text-brand/70">{promotion.badge}</span>
                  </>
                )}
              </div>
              <h3 className="text-base font-semibold text-zinc-100 mb-1">{promotion.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{promotion.description}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-brand/50 group-hover:text-brand/70 shrink-0 mt-1 transition" />
          </div>
        </div>
      </a>
    </li>
  )
}
