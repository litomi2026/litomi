'use client'

import { ChevronRight, Gift, Heart, MousePointerClick } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { AD_SLOTS } from '@/components/ads/constants'
import LazyAdSlot from '@/components/ads/LazyAdSlot'

export default function RewardedAdSection() {
  const [lastEarned, setLastEarned] = useState<number | null>(null)

  function handleAdClick(result: { success: boolean; earned?: number; error?: string }) {
    if (result.success && result.earned) {
      setLastEarned(result.earned)
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-4">
      {/* 작가 후원 안내 */}
      <div className="flex items-start gap-3 p-4 bg-linear-to-r from-pink-500/10 to-rose-500/10 rounded-lg border border-pink-500/20">
        <Heart className="size-5 text-pink-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-zinc-200 mb-1">광고 수익은 작가에게 돌아가요</h3>
          <p className="text-sm text-zinc-400">
            광고로 발생한 수익금은 서버 운영비를 제하고 전부 작가에게 후원할 예정이에요. 광고 클릭 한 번이 좋아하는 작품의
            창작자를 응원하는 방법이 돼요.
          </p>
        </div>
      </div>

      {/* 설명 */}
      <div className="flex items-start gap-3 p-4 bg-zinc-800/50 rounded-lg">
        <Gift className="size-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-zinc-200 mb-1">광고를 클릭하고 리보를 받으세요!</h3>
          <p className="text-sm text-zinc-400">
            아래 광고를 클릭하면 <span className="text-amber-400 font-semibold">10 리보</span>가 적립돼요. 적립된 리보로
            내 공간을 확장할 수 있어요.
          </p>
        </div>
      </div>

      {/* 광고 영역 */}
      <div className="flex flex-wrap justify-center gap-4">
        <LazyAdSlot
          adSlotId={AD_SLOTS.REWARDED.id}
          height={AD_SLOTS.REWARDED.height}
          onAdClick={handleAdClick}
          width={AD_SLOTS.REWARDED.width}
          zoneId={AD_SLOTS.REWARDED.zoneId}
        />
        <LazyAdSlot
          adSlotId={AD_SLOTS.REWARDED_2.id}
          height={AD_SLOTS.REWARDED_2.height}
          onAdClick={handleAdClick}
          width={AD_SLOTS.REWARDED_2.width}
          zoneId={AD_SLOTS.REWARDED_2.zoneId}
        />
      </div>

      {/* CLS 방지: 두 상태 모두 렌더링하고 visibility로 전환 */}
      <div className="relative h-5">
        <div
          aria-hidden={!!lastEarned}
          className="absolute inset-0 flex items-center justify-center gap-2 text-xs transition-opacity aria-hidden:opacity-0"
        >
          <MousePointerClick className="size-3 text-zinc-500" />
          <span className="text-zinc-500">광고를 클릭하여 리보 적립</span>
        </div>
        <div
          aria-hidden={!lastEarned}
          className="absolute inset-0 flex items-center justify-center gap-2 text-xs transition-opacity aria-hidden:opacity-0"
        >
          <Gift className="size-3 text-green-400" />
          <span className="text-green-400">+{lastEarned ?? 0} 리보 적립 완료!</span>
        </div>
      </div>

      {/* 주의사항 */}
      <details className="text-xs text-zinc-500 group">
        <summary className="cursor-pointer list-none flex items-center gap-1 hover:text-zinc-400 transition [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-3 transition-transform group-open:rotate-90" />
          주의사항
        </summary>
        <div className="mt-2 space-y-1 pl-4">
          <p>• 광고 클릭 시 새 탭에서 광고 페이지가 열려요</p>
          <p>• 같은 유저: 1분 후 다시 적립 가능</p>
          <p>• 같은 광고: 5분 후 다시 클릭 가능</p>
          <p>• 하루 최대 100 리보 (10회) 적립 가능</p>
        </div>
      </details>
    </div>
  )
}
