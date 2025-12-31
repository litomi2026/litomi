'use client'

import { TurnstileInstance } from '@marsidev/react-turnstile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MousePointerClick, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { POSTV1PointTurnstileResponse } from '@/backend/api/v1/points/turnstile'

import { AD_SLOTS } from '@/components/ads/constants'
import JuicyAdsSlot, { type AdClickResult } from '@/components/ads/JuicyAdsSlot'
import TurnstileWidget from '@/components/TurnstileWidget'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import usePointsTurnstileQuery from '@/query/usePointsTurnstileQuery'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function RewardedAdSection() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const pointsTurnstile = usePointsTurnstileQuery(Boolean(me))
  const verificationSectionRef = useRef<HTMLDivElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const isVerified = pointsTurnstile.data?.verified === true
  const rewardEnabled = Boolean(me) && isVerified

  const verifyTurnstile = useMutation<POSTV1PointTurnstileResponse, ProblemDetailsError, string>({
    mutationFn: async (token) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/turnstile`
      const { data } = await fetchWithErrorHandling<POSTV1PointTurnstileResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })
      return data
    },
    onSuccess: () => {
      setTurnstileToken('')
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTurnstile })
    },
    onError: (err) => {
      toast.error(err.message)
      setTurnstileToken('')
      turnstileRef.current?.reset()
    },
  })

  function handleAdClick(result: AdClickResult) {
    if (!me) {
      toast.warning('로그인하면 리보가 적립돼요')
      return
    }

    if (!isVerified) {
      toast.warning('보안 검증을 완료해 주세요')
      verificationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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

  // NOTE: 보안 검증 토큰 만료 시 쿼리 캐시 무효화
  useEffect(() => {
    if (pointsTurnstile.data?.verified !== true) {
      return
    }

    const timeoutMs = Math.max(0, pointsTurnstile.data.expiresInSeconds * 1000)

    const timeoutId = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTurnstile })
    }, timeoutMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [pointsTurnstile.data, queryClient])

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
        <span className="text-zinc-500">
          {!me
            ? '로그인 후 광고를 클릭하면 리보가 적립돼요'
            : !isVerified
              ? '보안 검증 후 광고를 클릭하면 리보가 적립돼요'
              : '광고를 클릭하여 리보 적립'}
        </span>
      </div>

      {/* Cloudflare 보안 검증 */}
      {me && (
        <div className="p-4 bg-zinc-900/40 rounded-lg border border-zinc-700 space-y-3" ref={verificationSectionRef}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-zinc-300 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">리보 적립 전에 보안 검증이 필요해요</h3>
              <p className="text-sm text-zinc-400">
                Cloudflare 보안 검증을 완료하면 10분 동안 리보를 적립할 수 있어요.
              </p>
            </div>
          </div>
          <TurnstileWidget
            onTokenChange={(token) => {
              setTurnstileToken(token)
              if (token) {
                verifyTurnstile.mutate(token)
              }
            }}
            options={{ action: 'points-earn' }}
            token={turnstileToken}
            turnstileRef={turnstileRef}
          />
          <p className="text-xs text-center text-zinc-500">
            {verifyTurnstile.isPending ? '인증을 확인하고 있어요…' : '인증을 확인했어요'}
          </p>
        </div>
      )}
    </div>
  )
}
