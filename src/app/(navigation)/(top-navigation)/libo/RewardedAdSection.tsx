'use client'

import { TurnstileInstance } from '@marsidev/react-turnstile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, HelpCircle, MousePointerClick, ShieldCheck } from 'lucide-react'
import ms from 'ms'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { GETV1MeResponse } from '@/backend/api/v1/me'
import type { POSTV1PointTurnstileResponse } from '@/backend/api/v1/points/turnstile/POST'
import type { AdClickResult } from '@/components/ads/types'

import AdsterraBanner300x250 from '@/components/ads/adsterra/AdsterraBanner300x250'
import AdsterraNativeBanner from '@/components/ads/adsterra/AdsterraNativeBanner'
import { AD_SLOTS } from '@/components/ads/juicy-ads/constants'
import JuicyAdsSlot from '@/components/ads/juicy-ads/JuicyAdsSlot'
import PlugRushBannerRectangle300x250 from '@/components/ads/plugrush/PlugRushBannerRectangle300x250'
import PlugRushNativeAd from '@/components/ads/plugrush/PlugRushNativeAd'
import TurnstileWidget from '@/components/TurnstileWidget'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { isAdultVerificationRequiredProblem } from '@/lib/QueryProvider'
import useMeQuery from '@/query/useMeQuery'
import usePointsTurnstileQuery from '@/query/usePointsTurnstileQuery'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

import { runWhenDocumentVisible } from './util'

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
    onError: (error) => {
      setTurnstileToken('')

      if (error.status === 403 && isAdultVerificationRequiredProblem(error.type)) {
        return
      }

      if (error.status === 401) {
        return
      }

      if (error.status >= 400 && error.status < 500) {
        turnstileRef.current?.reset()
      }
    },
  })

  function handleAdClick(result: AdClickResult) {
    if (!me) {
      runWhenDocumentVisible(() => {
        toast.warning('로그인하면 리보가 적립돼요')
      })
      return
    }

    if (!isVerified) {
      runWhenDocumentVisible(() => {
        toast.warning('보안 검증을 완료해 주세요')
        verificationSectionRef.current?.scrollIntoView({ block: 'center' })
      })
      return
    }

    if (result.error || !result.success || result.earned == null) {
      return
    }

    runWhenDocumentVisible(() => {
      toast.success(`${result.earned} 리보 적립됐어요`)
    })
  }

  function handleTurnstileTokenChange(token: string) {
    setTurnstileToken(token)
    if (token) {
      verifyTurnstile.mutate(token)
    }
  }

  // NOTE: 보안 검증 토큰 만료 시 쿼리 캐시 무효화
  useEffect(() => {
    if (pointsTurnstile.data?.verified !== true) {
      return
    }

    const timeoutMs = Math.max(0, pointsTurnstile.data.expiresInSeconds * ms('1s'))

    const timeoutId = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTurnstile })
    }, timeoutMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [pointsTurnstile.data, queryClient])

  return (
    <div className="flex flex-col gap-4">
      {/* 작가 후원 안내 (상시 노출, 컴팩트) */}
      <details className="rounded-xl bg-white/4 border border-white/7">
        <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-2 text-sm text-zinc-200 [&::-webkit-details-marker]:hidden">
          <Heart className="size-4 text-zinc-400" />
          <span className="font-medium">광고 수익은 작가에게 돌아가요</span>
          <span className="ml-auto text-xs text-zinc-500">자세히</span>
        </summary>
        <div className="px-4 pb-4 text-sm text-zinc-400">
          광고 수익은 서버 운영비를 제외하고 모두 작가 후원에 사용할 예정이에요. 광고를 한 번 봐주시면 좋아하는 작품의
          창작자를 응원하는 데 도움이 돼요. 광고는 앞으로도{' '}
          <code className="inline-flex items-center whitespace-nowrap rounded-md bg-white/6 px-1.5 py-0.5 font-mono text-xs text-zinc-200 ring-1 ring-white/10">
            /libo
          </code>{' '}
          페이지에서만 노출할 거예요.
        </div>
      </details>

      {/* 광고 영역 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
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
        <span className="text-zinc-500">{getRewardedAdStatus(me, isVerified)}</span>
      </div>

      {/* 안내 문구 */}
      <details className="text-xs text-zinc-500 rounded-xl bg-white/4 border border-white/7">
        <summary className="cursor-pointer list-none p-3 flex items-center gap-2 text-zinc-300 [&::-webkit-details-marker]:hidden">
          <HelpCircle className="size-4 text-zinc-400" />
          <span className="font-medium">안내</span>
        </summary>
        <div className="px-3 pb-3 space-y-4">
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">리보란?</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>광고 클릭 시 10 리보가 적립돼요</li>
              <li>적립된 리보로 내 공간을 확장할 수 있어요</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">적립 주의사항</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>광고 클릭 시 새 탭에서 광고 페이지가 열려요</li>
              <li>같은 광고: 1분 후 다시 클릭 가능</li>
              <li>하루 최대 100 리보 (10회) 적립 가능</li>
            </ul>
          </div>
        </div>
      </details>

      {/* Cloudflare 보안 검증 */}
      {me && (
        <div className="p-4 rounded-xl bg-white/4 border border-white/7 space-y-3" ref={verificationSectionRef}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-zinc-300 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">리보 적립 전에 보안 검증이 필요해요</h3>
              <p className="text-sm text-zinc-400">Cloudflare 보안 검증을 완료하면 2분 동안 리보를 적립할 수 있어요.</p>
            </div>
          </div>
          <TurnstileWidget
            onTokenChange={handleTurnstileTokenChange}
            options={{ action: 'points-earn' }}
            token={turnstileToken}
            turnstileRef={turnstileRef}
          />
          <p className="text-xs text-center text-zinc-500">
            {getTurnstileStatus(isVerified, verifyTurnstile.isPending)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <AdsterraBanner300x250 adSlotId="rewarded-ad-adsterra" onAdClick={handleAdClick} rewardEnabled={false} />
        <PlugRushBannerRectangle300x250 />
      </div>

      {/* NativeBanner */}
      <AdsterraNativeBanner className="w-full max-w-5xl mx-auto" />
      <PlugRushNativeAd className="w-full max-w-5xl mx-auto" />
    </div>
  )
}

function getRewardedAdStatus(me: GETV1MeResponse | null | undefined, isVerified: boolean) {
  if (!me) {
    return '로그인 후 광고를 클릭하면 리보가 적립돼요'
  }
  if (!isVerified) {
    return '보안 검증 후 광고를 클릭하면 리보가 적립돼요'
  }
  return '상단 광고를 클릭하면 리보가 적립돼요'
}

function getTurnstileStatus(isVerified: boolean, isPending: boolean) {
  if (isVerified) {
    return '인증됐어요'
  }
  if (isPending) {
    return '인증을 확인하고 있어요…'
  }
  return '인증을 확인해 주세요'
}
