'use client'

import type { GETV1MeResponse } from '@litomi/contracts'

import { X } from 'lucide-react'
import { useRef } from 'react'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import AdsterraBanner300x250 from '@/components/ads/adsterra/AdsterraBanner300x250'
import { hasAdultAccess } from '@/utils/adult-verification'

type Props = {
  me: GETV1MeResponse
  remaining: number
  onClose: () => void
  onGranted: () => void
}

export function SexFortuneRerollGate({ me, remaining, onClose, onGranted }: Props) {
  const grantedRef = useRef(false)
  const canAccess = hasAdultAccess(me)

  // rewardEnabled=false 슬롯은 광고 클릭아웃 감지 시에만 콜백을 부름 → 리롤 부여 신호로 사용.
  function handleAdClick() {
    if (grantedRef.current) {
      return
    }

    grantedRef.current = true
    onGranted()
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold tracking-tight text-zinc-100">🎰 다시 뽑기</p>
          <p className="mt-1 text-xs text-zinc-400">
            광고를 한 번 눌러서 새로고침 없이 다시 뽑아요. 오늘 <span className="tabular-nums">{remaining}</span>번
            남았어요.
          </p>
        </div>
        <button
          aria-label="닫기"
          className="rounded-lg border border-white/8 bg-white/5 p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        {canAccess ? (
          <AdsterraBanner300x250 adSlotId="fortune-reroll" onAdClick={handleAdClick} rewardEnabled={false} />
        ) : (
          <AdultVerificationGate description="다시 뽑기는 성인 인증 후 이용할 수 있어요." />
        )}
      </div>
    </div>
  )
}
