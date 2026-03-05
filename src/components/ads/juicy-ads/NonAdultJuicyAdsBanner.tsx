'use client'

import Cookies from 'js-cookie'
import { twMerge } from 'tailwind-merge'

import { CookieKey } from '@/constants/storage'
import useMeQuery from '@/query/useMeQuery'

import { AD_SLOTS } from './constants'
import JuicyAdsScript from './JuicyAdsScript'
import JuicyAdsSlot from './JuicyAdsSlot'

const NON_ADULT_BANNER_SLOTS = [AD_SLOTS.REWARDED, AD_SLOTS.REWARDED_2] as const

type Props = {
  className?: string
}

export default function NonAdultJuicyAdsBanner({ className }: Props) {
  const { data: me, isPending } = useMeQuery()
  const hasAuthHint = Cookies.get(CookieKey.AUTH_HINT) === '1'

  // NOTE: 로그인 사용자는 me 응답이 올 때까지 잠깐 숨겨서 성인인증 완료 사용자에 대한 깜빡임을 막아요.
  if (hasAuthHint && isPending) {
    return null
  }

  if (me?.adultVerification?.status === 'adult') {
    return null
  }

  return (
    <section className={twMerge(`rounded-xl border border-white/7 bg-white/3 p-3`, className)}>
      <div className="mb-3 space-y-1 text-center">
        <p className="text-sm text-zinc-300">광고 수익은 서비스 운영과 작가 후원에 사용돼요.</p>
        <p className="text-xs text-zinc-500">성인 인증을 완료하면 이 광고 영역은 자동으로 숨겨져요.</p>
      </div>

      <JuicyAdsScript />

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {NON_ADULT_BANNER_SLOTS.map((slot) => (
          <JuicyAdsSlot
            adSlotId={slot.id}
            height={slot.height}
            key={slot.id}
            rewardEnabled={false}
            showFooter={false}
            width={slot.width}
            zoneId={slot.zoneId}
          />
        ))}
      </div>
    </section>
  )
}
