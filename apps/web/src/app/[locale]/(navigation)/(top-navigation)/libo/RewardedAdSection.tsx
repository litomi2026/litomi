'use client'

import type { GETV1MeResponse, POSTV1PointTurnstileResponse } from '@litomi/contracts'

import { POINT_CONSTANTS } from '@litomi/domain/points/model'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HelpCircle, MousePointerClick, ShieldCheck } from 'lucide-react'
import ms from 'ms'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import AdsterraBanner300x250 from '@/components/ads/adsterra/AdsterraBanner300x250'
import AdsterraNativeBanner from '@/components/ads/adsterra/AdsterraNativeBanner'
import { AD_SLOTS } from '@/components/ads/juicy-ads/constants'
import JuicyAdsSlot from '@/components/ads/juicy-ads/JuicyAdsSlot'
import type { AdClickResult } from '@/components/ads/types'
import TurnstileWidget from '@/components/TurnstileWidget'
import { isAdultVerificationRequiredProblem } from '@/lib/react-query/QueryProvider'
import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import usePointsTurnstileQuery from '@/query/usePointsTurnstileQuery'
import { fetchAPIData } from '@/utils/api-request'
import type { ProblemDetailsError } from '@/utils/fetch-response'

import { runWhenDocumentVisible } from './util'

export default function RewardedAdSection() {
  const verificationSectionRef = useRef<HTMLDivElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const { data: me } = useMeQuery()
  const isLoggedIn = Boolean(me)
  const pointsTurnstile = usePointsTurnstileQuery(isLoggedIn)
  const t = useTranslations('Libo.earn')
  const queryClient = useQueryClient()

  const isVerified = pointsTurnstile.data?.verified === true
  const rewardEnabled = isLoggedIn && isVerified

  const verifyTurnstile = useMutation<POSTV1PointTurnstileResponse, ProblemDetailsError, string>({
    mutationFn: async (token) => {
      const url = '/api/v1/points/turnstile'

      const { data } = await fetchAPIData<POSTV1PointTurnstileResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      return data
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTurnstile })
    },

    onError: (error) => {
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
    if (me === undefined) {
      return
    }

    if (me === null) {
      runWhenDocumentVisible(() => {
        toast.warning(t('loginToast'))
      })
      return
    }

    if (!isVerified) {
      runWhenDocumentVisible(() => {
        toast.warning(t('verifyToast'))
        verificationSectionRef.current?.scrollIntoView({ block: 'center' })
      })
      return
    }

    if (result.error || !result.success || result.earned == null) {
      return
    }

    runWhenDocumentVisible(() => {
      if (result.earned) {
        toast.success(t('earnedToast', { earned: result.earned }))
      }
    })
  }

  function handleTurnstileTokenChange(token: string) {
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

  function getRewardedAdStatus(me: GETV1MeResponse | null | undefined, isVerified: boolean) {
    if (me === null) {
      return t('statusLogin')
    }
    if (!isVerified) {
      return t('statusVerify')
    }
    return t('statusReady')
  }

  function getTurnstileStatus(isVerified: boolean, isPending: boolean) {
    if (isVerified) {
      return t('turnstileVerified')
    }
    if (isPending) {
      return t('turnstilePending')
    }
    return t('turnstileRequired')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 안내 문구 */}
      <details className="text-xs text-zinc-500 rounded-xl bg-white/4 border border-white/7">
        <summary className="cursor-pointer list-none p-3 flex items-center gap-2 text-zinc-300 [&::-webkit-details-marker]:hidden">
          <HelpCircle className="size-4 text-zinc-400" />
          <span className="font-medium">{t('guideTitle')}</span>
        </summary>
        <div className="px-3 pb-3 space-y-4">
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">{t('guideWhatIs')}</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>{t('guideAdClick', { amount: POINT_CONSTANTS.AD_CLICK_REWARD })}</li>
              <li>{t('guideExpand')}</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-zinc-400 font-medium">{t('guideNotesTitle')}</p>
            <ul className="space-y-1 list-disc list-inside marker:text-zinc-600">
              <li>{t('guideNotesNewTab')}</li>
              <li>{t('guideNotesCooldown')}</li>
              <li>
                {t('guideNotesLimit', {
                  limit: POINT_CONSTANTS.AD_CLICK_REWARD * POINT_CONSTANTS.DAILY_EARN_LIMIT_COUNT,
                })}
              </li>
            </ul>
          </div>
        </div>
      </details>

      {/* 광고 영역 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <JuicyAdsSlot
          adSlotId={AD_SLOTS.BANNER_308X286.id}
          height={AD_SLOTS.BANNER_308X286.height}
          onAdClick={handleAdClick}
          rewardEnabled={rewardEnabled}
          showFooter
          width={AD_SLOTS.BANNER_308X286.width}
          zoneId={AD_SLOTS.BANNER_308X286.zoneId}
        />
        <JuicyAdsSlot
          adSlotId={AD_SLOTS.BANNER_308X286_2.id}
          height={AD_SLOTS.BANNER_308X286_2.height}
          onAdClick={handleAdClick}
          rewardEnabled={rewardEnabled}
          showFooter
          width={AD_SLOTS.BANNER_308X286_2.width}
          zoneId={AD_SLOTS.BANNER_308X286_2.zoneId}
        />
        <JuicyAdsSlot
          adSlotId={AD_SLOTS.BANNER_300X100.id}
          height={AD_SLOTS.BANNER_300X100.height}
          onAdClick={handleAdClick}
          rewardEnabled={rewardEnabled}
          showFooter
          width={AD_SLOTS.BANNER_300X100.width}
          zoneId={AD_SLOTS.BANNER_300X100.zoneId}
        />
        <JuicyAdsSlot
          adSlotId={AD_SLOTS.BANNER_300X100_2.id}
          height={AD_SLOTS.BANNER_300X100_2.height}
          onAdClick={handleAdClick}
          rewardEnabled={rewardEnabled}
          showFooter
          width={AD_SLOTS.BANNER_300X100_2.width}
          zoneId={AD_SLOTS.BANNER_300X100_2.zoneId}
        />
      </div>

      {/* CLS 방지: 두 상태 모두 렌더링하고 visibility로 전환 */}
      <div className="relative h-5 flex items-center justify-center gap-2 text-xs">
        <MousePointerClick className="size-3 text-zinc-500" />
        <span className="text-zinc-500">{getRewardedAdStatus(me, isVerified)}</span>
      </div>

      {/* Cloudflare 보안 검증 */}
      {me && (
        <div className="p-4 rounded-xl bg-white/4 border border-white/7 space-y-3" ref={verificationSectionRef}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="size-5 text-zinc-300 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-zinc-200 mb-1">{t('turnstileTitle')}</h3>
              <p className="text-xs text-zinc-400">{t('turnstileDesc')}</p>
            </div>
          </div>
          <TurnstileWidget
            id="points-earn-turnstile"
            onTokenChange={handleTurnstileTokenChange}
            options={{ action: 'points-earn' }}
            turnstileRef={turnstileRef}
          />
          <p className="text-xs text-center text-zinc-500">
            {getTurnstileStatus(isVerified, verifyTurnstile.isPending)}
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        <AdsterraBanner300x250 adSlotId="rewarded-ad-adsterra" onAdClick={handleAdClick} rewardEnabled={false} />
      </div>

      <AdsterraNativeBanner className="w-full max-w-5xl mx-auto" />
    </div>
  )
}
