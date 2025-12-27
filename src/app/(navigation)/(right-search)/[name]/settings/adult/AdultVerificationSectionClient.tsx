'use client'

import { useMutation } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import ms from 'ms'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { POSTV1BBatonAttemptResponse } from '@/backend/api/v1/bbaton/attempt'
import { POSTV1BBatonUnlinkResponse } from '@/backend/api/v1/bbaton/unlink'
import { BBATON_ADULT_VERIFICATION_CHANNEL_NAME, BBATON_POPUP_WINDOW_NAME } from '@/constants/bbaton'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import BBatonButton from '@/svg/BBatonButton'
import { formatDistanceToNow } from '@/utils/date'

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
  isTwoFactorEnabled: boolean
}

export default function AdultVerificationSectionClient({ initialVerification, isTwoFactorEnabled }: Props) {
  const router = useRouter()
  const unlinkFormRef = useRef<HTMLFormElement | null>(null)
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

  const unlinkMutation = useMutation<POSTV1BBatonUnlinkResponse, unknown, { password: string; token?: string }>({
    mutationFn: async ({ password, token }) => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/unlink`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...(token ? { token } : {}) }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw { status: response.status, error: message }
      }

      return (await response.json()) as POSTV1BBatonUnlinkResponse
    },
    onSuccess: () => {
      toast.success('연동이 해제됐어요')
      unlinkFormRef.current?.reset()
      router.refresh()
    },
    onError: (error) => {
      const apiError = error as ApiError

      if (apiError.status === 401 && (!apiError.error || apiError.error.length === 0)) {
        toast.warning('로그인이 필요해요')
        router.refresh()
        return
      }

      if (typeof apiError.error === 'string' && apiError.error.length > 0) {
        toast.error(apiError.error)
        return
      }

      toast.error('연동을 해제하지 못했어요. 잠시 후 다시 시도해 주세요.')
    },
  })

  function startVerification() {
    if (!verifyMutation.isPending) {
      verifyMutation.mutate()
    }
  }

  function handleUnlinkSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const password = String(formData.get('password') ?? '')
    const token = formData.get('token')
    const tokenValue = typeof token === 'string' && token.length > 0 ? token : undefined

    unlinkMutation.mutate({ password, token: tokenValue })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
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
        {verifiedAtLabel && (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-400">마지막 인증</div>
            <div className="text-sm text-zinc-200" title={verifiedAt?.toLocaleString() ?? ''}>
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

      {initialVerification && (
        <div className="pt-2 border-t border-zinc-800/80">
          <details className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
                <div className="text-sm font-medium text-red-300">연동 해제</div>
                <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
              </div>
            </summary>

            <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-3">
              <p className="text-sm text-zinc-400">
                연동을 해제하면 인증 정보가 삭제되고 <span className="text-zinc-300">미인증</span> 상태로 돌아가요. 성인
                콘텐츠 이용이 제한될 수 있어요.
              </p>

              <form className="grid gap-3" onSubmit={handleUnlinkSubmit} ref={unlinkFormRef}>
                <div className="grid gap-1.5">
                  <label className="text-sm text-zinc-300" htmlFor="bbaton-unlink-password">
                    현재 비밀번호
                  </label>
                  <input
                    autoComplete="current-password"
                    className="w-full rounded-md bg-zinc-800 border border-zinc-600 px-3 py-2 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:bg-zinc-700 disabled:text-zinc-400"
                    disabled={unlinkMutation.isPending}
                    id="bbaton-unlink-password"
                    name="password"
                    placeholder="비밀번호를 입력해 주세요"
                    required
                    type="password"
                  />
                </div>

                {isTwoFactorEnabled && (
                  <div className="grid gap-1.5">
                    <label className="text-sm text-zinc-300" htmlFor="bbaton-unlink-token">
                      2단계 인증 코드
                    </label>
                    <input
                      className="w-full rounded-md bg-zinc-800 border border-zinc-600 px-3 py-2 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:bg-zinc-700 disabled:text-zinc-400"
                      disabled={unlinkMutation.isPending}
                      id="bbaton-unlink-token"
                      inputMode="numeric"
                      name="token"
                      pattern="\\d{6}"
                      placeholder="6자리 코드"
                      required
                      type="text"
                    />
                  </div>
                )}

                <button
                  aria-disabled={unlinkMutation.isPending}
                  className="w-full inline-flex justify-center rounded-lg border border-zinc-800 bg-transparent px-4 py-2.5 text-sm font-medium text-red-300 transition aria-disabled:opacity-60 hover:bg-red-950/20 active:bg-red-950/30"
                  type="submit"
                >
                  연동 해제하기
                </button>
              </form>
            </div>
          </details>
        </div>
      )}
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
