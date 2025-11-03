'use client'

import { sendGAEvent } from '@next/third-parties/google'
import { Heart } from 'lucide-react'
import { usePathname } from 'next/navigation'

import useGAViewEvent from '@/hook/useGAViewEvent'

import LogoDiscord from '../icons/LogoDiscord'
import LogoGitHub from '../icons/LogoGitHub'
import LogoX from '../icons/LogoX'
import { MangaCardSkeleton } from './MangaCard'

export default function MangaCardDonation() {
  const pathname = usePathname()

  const { ref: cardRef } = useGAViewEvent({
    eventName: 'view_promotion',
    eventParams: {
      promotion_id: 'litomi_donation_card',
      promotion_name: '리토미 후원',
      creative_name: 'donation_card',
      creative_slot: 'content_feed',
      location_id: pathname,
    },
  })

  function handleSocialClick(platform: string) {
    sendGAEvent('event', 'select_promotion', {
      promotion_id: `litomi_social_${platform}`,
      promotion_name: '소셜 링크',
      creative_name: 'donation_card',
      creative_slot: 'social_section',
      location_id: pathname,
      destination: platform,
    })
  }

  function handleDonationClick(platform: string) {
    sendGAEvent('event', 'select_promotion', {
      promotion_id: `litomi_donation_${platform}`,
      promotion_name: '후원 플랫폼',
      creative_name: 'donation_card',
      creative_slot: 'donation_section',
      location_id: pathname,
      destination: platform,
    })
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
          <h3 className="text-lg font-semibold text-foreground">리토미를 함께 키워주세요</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          매달 십 몇 만 원의 서버 비용이 발생하는데, 유해 광고 없이 서비스를 운영하기 위해 여러분의 도움이 필요해요
        </p>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">소셜</span>
            <div className="flex flex-col gap-2">
              <a
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium"
                href="https://x.com/litomi_in"
                onClick={() => handleSocialClick('x_twitter')}
                rel="noopener"
                target="_blank"
              >
                <LogoX className="size-4" />
                <span>@litomi_in 팔로우</span>
              </a>
              <a
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium"
                href="https://discord.gg/xTrbQaxpyD"
                onClick={() => handleSocialClick('discord')}
                rel="noopener"
                target="_blank"
              >
                <LogoDiscord className="size-4" />
                <span>Discord 서버 참여</span>
              </a>
              <a
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium"
                href="https://github.com/gwak2837/litomi"
                onClick={() => handleSocialClick('github')}
                rel="noopener"
                target="_blank"
              >
                <LogoGitHub className="size-4" />
                <span>GitHub star</span>
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">후원</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                className="p-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium text-center"
                href="https://patreon.com/litomi"
                onClick={() => handleDonationClick('patreon')}
                rel="noopener"
                target="_blank"
              >
                Patreon
              </a>
              <a
                className="p-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium text-center"
                href="https://ko-fi.com/litomi"
                onClick={() => handleDonationClick('ko-fi')}
                rel="noopener"
                target="_blank"
              >
                Ko-fi
              </a>
              <a
                className="py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium text-center"
                href="https://opencollective.com/litomi"
                onClick={() => handleDonationClick('open_collective')}
                rel="noopener"
                target="_blank"
              >
                open collective
              </a>
              <a
                className="flex items-center justify-center bg-[#FFDD00] rounded-lg overflow-hidden"
                href="https://www.buymeacoffee.com/litomi"
                onClick={() => handleDonationClick('buy_me_a_coffee')}
                rel="noopener"
                target="_blank"
              >
                <img
                  alt="Buy me a coffee"
                  className="max-h-9"
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">제휴</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                className="col-span-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition text-sm font-medium text-center"
                href="https://velog.io/@gwak2837/coupang-partners-samdasoo"
                onClick={() => handleDonationClick('coupang_partners')}
                rel="noopener"
                target="_blank"
              >
                쿠팡 파트너스
              </a>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-500">참여해주신다면 감사하겠습니다 🙇</p>
      </div>
    </MangaCardSkeleton>
  )
}
