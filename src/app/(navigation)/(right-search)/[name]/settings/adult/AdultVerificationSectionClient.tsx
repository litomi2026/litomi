'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { BBatonSSECompleteEvent, BBatonSSETimeoutEvent } from '@/backend/api/v1/bbaton/events'

import { POSTV1BBatonAttemptResponse } from '@/backend/api/v1/bbaton/attempt'
import { BBATON_POPUP_WINDOW_NAME } from '@/constants/bbaton'
import { env } from '@/env/client'
import BBatonButton from '@/svg/BBatonButton'
import { formatDistanceToNow } from '@/utils/format/date'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

import AdultVerificationHelp from './AdultVerificationHelp'
import BBatonUnlinkSection from './BBatonUnlinkSection'

const { NEXT_PUBLIC_BACKEND_URL } = env

type BroadcastResult = {
  at: number
  adultFlag?: 'N' | 'Y'
  error?: string
}

type Props = {
  initialVerification?: {
    adultFlag: boolean
    verifiedAt: Date | null
  }
  isTwoFactorEnabled: boolean
}

export default function AdultVerificationSectionClient({ initialVerification, isTwoFactorEnabled }: Props) {
  const router = useRouter()
  const [needsManualRefresh, setNeedsManualRefresh] = useState(false)
  const verifiedAt = initialVerification?.verifiedAt
  const verifiedAtLabel = verifiedAt ? formatDistanceToNow(new Date(verifiedAt)) : null

  const status = useMemo(() => {
    if (!initialVerification) {
      return { label: '미인증', tone: 'zinc' }
    }
    if (initialVerification.adultFlag) {
      return { label: '성인', tone: 'green' }
    }
    return { label: '성인 아님', tone: 'red' }
  }, [initialVerification])

  const verifyMutation = useMutation<BroadcastResult, unknown, void>({
    mutationFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/attempt`

      const { data } = await fetchWithErrorHandling<POSTV1BBatonAttemptResponse>(url, {
        method: 'POST',
        credentials: 'include',
      })

      const { authorizeUrl, expiresIn } = data
      const eventsUrl = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/events`
      const popup = window.open(authorizeUrl, BBATON_POPUP_WINDOW_NAME, 'width=420,height=580')

      if (!popup) {
        throw { status: 0, error: '팝업을 열 수 없어요. 팝업 차단을 해제해 주세요.' }
      }

      return await new Promise<BroadcastResult>((resolve, reject) => {
        let done = false
        let eventSource: EventSource | null = null

        const cleanup = () => {
          eventSource?.close()
          eventSource = null
          window.removeEventListener('focus', onFocus)
        }

        const onComplete = (event: MessageEvent<string>) => {
          if (done) {
            return
          }

          const parsed = safeParseJSON<BBatonSSECompleteEvent>(event.data)
          if (!parsed || parsed.type !== 'complete') {
            return
          }

          done = true
          cleanup()
          resolve({ at: Date.now(), adultFlag: parsed.adultFlag })
        }

        const onTimeout = (event: MessageEvent<string>) => {
          if (done) {
            return
          }

          const parsed = safeParseJSON<BBatonSSETimeoutEvent>(event.data)
          if (!parsed || parsed.type !== 'timeout') {
            return
          }

          done = true
          cleanup()
          reject({ status: 0, error: '인증 시도가 만료됐어요. 다시 시도해 주세요.' })
        }

        const onError = () => {
          if (done) {
            return
          }
        }

        const onFocus = () => {
          if (done || !popup.closed) {
            return
          }

          done = true
          cleanup()
          reject({
            status: 0,
            code: 'needs_refresh',
            error: '인증이 완료됐는지 확인하려면 상태 새로고침을 눌러 주세요.',
          })
        }

        window.addEventListener('focus', onFocus)

        try {
          eventSource = new EventSource(eventsUrl, { withCredentials: true })
          eventSource.addEventListener('complete', onComplete)
          eventSource.addEventListener('timeout', onTimeout)
          eventSource.addEventListener('error', onError)
        } catch {
          cleanup()
          reject({
            status: 0,
            error: `연결에 실패했어요. ${Math.ceil(expiresIn / 60)}분 후에 다시 시도해 주세요.`,
          })
        }
      })
    },
    onSuccess: (result) => {
      setNeedsManualRefresh(false)
      if (result.adultFlag === 'Y') {
        toast.success('성인 인증이 완료됐어요')
      } else if (result.adultFlag === 'N') {
        toast.success('인증 결과가 저장됐어요', { description: '성인으로 확인되지 않았어요' })
      } else {
        toast.success('인증 결과가 저장됐어요')
      }
      router.refresh()
    },
    onError: (error) => {
      if (isNeedsRefreshError(error)) {
        setNeedsManualRefresh(true)
      }
      toast.error(getErrorMessage(error))
      if (error instanceof ProblemDetailsError && error.status === 401) {
        router.refresh()
      }
    },
  })

  function startVerification() {
    if (!verifyMutation.isPending) {
      setNeedsManualRefresh(false)
      verifyMutation.mutate()
    }
  }

  function refreshStatus() {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-zinc-400">현재 상태</div>
          <span
            className={twMerge(
              'inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium',
              status.tone === 'green'
                ? 'border-green-700/60 bg-green-950/40 text-green-300'
                : status.tone === 'red'
                  ? 'border-red-700/60 bg-red-950/40 text-red-300'
                  : 'border-zinc-700 bg-zinc-900/40 text-zinc-300',
            )}
          >
            {status.label}
          </span>
        </div>
        {needsManualRefresh && (
          <button
            className="w-fit text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-300"
            onClick={refreshStatus}
            type="button"
          >
            상태 새로고침
          </button>
        )}
        {verifiedAtLabel && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-400">마지막 인증</div>
            <div className="text-sm text-zinc-200" title={verifiedAt?.toLocaleString()}>
              {verifiedAtLabel}
            </div>
          </div>
        )}
      </div>
      <button
        aria-disabled={verifyMutation.isPending}
        className="w-full overflow-hidden rounded transition aria-disabled:opacity-60 active:opacity-90"
        onClick={startVerification}
        title={initialVerification ? '비바톤으로 다시 인증하기' : '비바톤으로 인증하기'}
        type="button"
      >
        <BBatonButton className="h-12 w-full" />
      </button>

      <p className="text-sm text-zinc-400">
        성인 콘텐츠를 안전하게 제공하기 위해 <span className="text-zinc-200">성인 여부 확인</span>이 필요할 수 있어요.
      </p>

      <AdultVerificationHelp />

      {initialVerification && <BBatonUnlinkSection isTwoFactorEnabled={isTwoFactorEnabled} />}
    </div>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ProblemDetailsError) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const message = (error as { error?: unknown }).error
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }

  if (error instanceof Error && !navigator.onLine) {
    return '네트워크 연결을 확인해 주세요.'
  }

  return '인증에 실패했어요. 다시 시도해 주세요.'
}

function isNeedsRefreshError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  if (!('code' in error)) {
    return false
  }

  return (error as { code?: unknown }).code === 'needs_refresh'
}

function safeParseJSON<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}
