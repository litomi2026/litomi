'use client'

import { Heart, MousePointerClick } from 'lucide-react'
import { toast } from 'sonner'

import { AD_SLOTS } from '@/components/ads/constants'
import JuicyAdsSlot, { type AdClickResult } from '@/components/ads/JuicyAdsSlot'
import useMeQuery from '@/query/useMeQuery'

export default function RewardedAdSection() {
  const { data: me } = useMeQuery()
  const rewardEnabled = Boolean(me)

  function handleAdClick(result: AdClickResult) {
    if (result.requiresLogin) {
      toast('로그인하면 리보가 적립돼요')
      return
    }

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (!result.success || result.earned == null) {
      return
    }

    toast.success(`${result.earned} 리보 적립됐어요`)
  }

  return (
    <div className="space-y-4">
      {/* 작가 후원 안내 */}
      <div className="flex items-start gap-3 p-4 bg-linear-to-r from-pink-500/10 to-rose-500/10 rounded-lg border border-pink-500/20">
        <Heart className="size-5 text-pink-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-zinc-200 mb-1">광고 수익은 작가에게 돌아가요</h3>
          <p className="text-sm text-zinc-400">
            광고로 발생한 수익금은 서버 운영비를 제하고 전부 작가에게 후원할 예정이에요. 광고 클릭 한 번이 좋아하는
            작품의 창작자를 응원하는 방법이 돼요.
          </p>
        </div>
      </div>

      {/* 광고 영역 */}
      <div className="flex flex-wrap justify-center gap-4">
        <JuicyAdsSlot
          adSlotId={AD_SLOTS.REWARDED.id}
          height={AD_SLOTS.REWARDED.height}
          onAdClick={handleAdClick}
          rewardEnabled={rewardEnabled}
          width={AD_SLOTS.REWARDED.width}
          zoneId={AD_SLOTS.REWARDED.zoneId}
        />
        <JuicyAdsSlot
          adSlotId={AD_SLOTS.REWARDED_2.id}
          height={AD_SLOTS.REWARDED_2.height}
          onAdClick={handleAdClick}
          rewardEnabled={rewardEnabled}
          width={AD_SLOTS.REWARDED_2.width}
          zoneId={AD_SLOTS.REWARDED_2.zoneId}
        />
      </div>

      {/* CLS 방지: 두 상태 모두 렌더링하고 visibility로 전환 */}
      <div className="relative h-5 flex items-center justify-center gap-2 text-xs">
        <MousePointerClick className="size-3 text-zinc-500" />
        <span className="text-zinc-500">광고를 클릭하여 리보 적립</span>
      </div>
    </div>
  )
}
