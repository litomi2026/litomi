'use client'

import Cookies from 'js-cookie'
import Link from 'next/link'
import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import { CookieKey } from '@/constants/storage'
import useMounted from '@/hook/useMounted'
import useMeQuery from '@/query/useMeQuery'

import { AD_SLOTS } from './constants'
import JuicyAdsScript from './JuicyAdsScript'
import JuicyAdsSlot from './JuicyAdsSlot'

type Props = {
  className?: string
  title?: ReactNode
  subtitle?: ReactNode
  slots?: readonly {
    id: string
    zoneId: number
    width: number
    height: number
  }[]
  onAdClick?: () => void
}

export default function NonAdultJuicyAdsBanner({
  className,
  title = '광고 수익은 서비스 운영과 작가 후원에 사용돼요.',
  slots = [AD_SLOTS.REWARDED, AD_SLOTS.REWARDED_2],
  subtitle,
  onAdClick,
}: Props) {
  const { data: me, isPending } = useMeQuery()
  const hasAuthHint = Cookies.get(CookieKey.AUTH_HINT) === '1'
  const isMounted = useMounted()

  if (!isMounted) {
    return null
  }

  // NOTE: 로그인 사용자는 me 응답이 올 때까지 잠깐 숨겨서 성인인증 완료 사용자에 대한 깜빡임을 막아요.
  if (hasAuthHint && isPending) {
    return null
  }

  if (me?.adultVerification?.status === 'adult') {
    return null
  }

  return (
    <section className={twMerge('flex flex-col gap-2', className)}>
      <div className="grid gap-1 text-center">
        <p className="text-sm text-zinc-300 font-medium">{title}</p>
        <p className="text-xs text-zinc-500">
          {subtitle || (
            <>
              <Link className="font-bold text-zinc-400 p-2 -m-2" href={`/@${me?.name ?? ''}/settings#adult`}>
                익명 성인인증
              </Link>
              을 완료하면 이 영역은 자동으로 숨겨져요.
            </>
          )}
        </p>
      </div>

      <JuicyAdsScript />

      <div className="flex flex-wrap justify-center gap-2">
        {slots.map((slot) => (
          <JuicyAdsSlot
            adSlotId={slot.id}
            height={slot.height}
            key={slot.id}
            onAdClick={onAdClick}
            showFooter={false}
            width={slot.width}
            zoneId={slot.zoneId}
          />
        ))}
      </div>
    </section>
  )
}
