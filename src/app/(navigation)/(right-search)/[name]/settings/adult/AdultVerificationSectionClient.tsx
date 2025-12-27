'use client'

import { useMutation } from '@tanstack/react-query'
import ms from 'ms'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { POSTV1BBatonAttemptResponse } from '@/backend/api/v1/bbaton/attempt'
import { BBATON_ADULT_VERIFICATION_CHANNEL_NAME, BBATON_POPUP_WINDOW_NAME } from '@/constants/bbaton'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import BBatonButton from '@/svg/BBatonButton'

const POPUP_CLOSE_GRACE_MS = ms('800ms')
const POPUP_MONITOR_INTERVAL_MS = ms('500ms')

type ApiError = {
  status?: number
  error?: string
}

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
}

export default function AdultVerificationSectionClient({ initialVerification }: Props) {
  const router = useRouter()

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
      const attemptRes = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/attempt`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!attemptRes.ok) {
        const message = await attemptRes.text().catch(() => '')
        throw { status: attemptRes.status, error: message }
      }

      const { authorizeUrl } = (await attemptRes.json()) as POSTV1BBatonAttemptResponse
      const channel = new BroadcastChannel(BBATON_ADULT_VERIFICATION_CHANNEL_NAME)
      const popup = window.open(authorizeUrl, BBATON_POPUP_WINDOW_NAME, 'width=420,height=580')

      if (!popup) {
        channel.close()
        throw { status: 0, error: '팝업을 열 수 없어요. 팝업 차단을 해제해 주세요.' }
      }

      return await new Promise<BroadcastResult>((resolve, reject) => {
        let done = false
        let closeHandled = false
        let monitor: number | null = null

        const cleanup = () => {
          channel.removeEventListener('message', onMessage)
          channel.close()
          if (monitor != null) {
            window.clearInterval(monitor)
            monitor = null
          }
        }

        const onMessage = (event: MessageEvent<unknown>) => {
          const parsed = parseBroadcastResult(event.data)
          if (!parsed) {
            return
          }

          done = true
          cleanup()

          if (parsed.error) {
            reject({ status: 0, error: parsed.error })
            return
          }

          resolve(parsed)
        }

        channel.addEventListener('message', onMessage)

        monitor = window.setInterval(() => {
          if (popup.closed) {
            if (closeHandled) {
              return
            }
            closeHandled = true

            window.setTimeout(() => {
              if (!done) {
                cleanup()
                reject({ status: 0, error: '인증이 취소됐어요' })
                return
              }
              cleanup()
            }, POPUP_CLOSE_GRACE_MS)
          }
        }, POPUP_MONITOR_INTERVAL_MS)
      })
    },
    onSuccess: (result) => {
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
      const apiError = error as ApiError

      if (apiError.status === 401) {
        toast.warning('로그인이 필요해요')
        router.refresh()
        return
      }

      if (typeof apiError.error === 'string' && apiError.error.length > 0) {
        toast.error(apiError.error)
        return
      }

      if (error instanceof Error) {
        if (!navigator.onLine) {
          toast.error('네트워크 연결을 확인해 주세요')
        } else {
          toast.error('요청 처리 중 오류가 발생했어요')
        }
        return
      }

      toast.error('인증을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
    },
  })

  function startVerification() {
    if (!verifyMutation.isPending) {
      verifyMutation.mutate()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">현재 상태</div>
        <span
          className={[
            'inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium',
            status.tone === 'green' && 'border-green-700/60 bg-green-950/40 text-green-300',
            status.tone === 'red' && 'border-red-700/60 bg-red-950/40 text-red-300',
            status.tone === 'zinc' && 'border-zinc-700 bg-zinc-900/40 text-zinc-300',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {status.label}
        </span>
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
    </div>
  )
}

function parseBroadcastResult(value: unknown): BroadcastResult | null {
  try {
    if (!value || typeof value !== 'object') return null
    if (!('at' in value)) return null

    const at = (value as { at: unknown }).at
    if (typeof at !== 'number') return null

    const adultFlag = (value as { adultFlag?: unknown }).adultFlag
    const error = (value as { error?: unknown }).error

    const normalized: BroadcastResult = { at }

    if (adultFlag === 'Y' || adultFlag === 'N') {
      normalized.adultFlag = adultFlag
    }

    if (typeof error === 'string' && error.length > 0) {
      normalized.error = error
    }

    return normalized
  } catch {
    return null
  }
}
