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
import { env } from '@/env/client'
import BBatonButton from '@/svg/BBatonButton'
import { formatDistanceToNow } from '@/utils/format/date'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env
const POPUP_CLOSE_GRACE_MS = ms('800ms')
const POPUP_MONITOR_INTERVAL_MS = ms('500ms')

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
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/attempt`

      const { data } = await fetchWithErrorHandling<POSTV1BBatonAttemptResponse>(url, {
        method: 'POST',
        credentials: 'include',
      })

      const { authorizeUrl } = data
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
      if (error instanceof ProblemDetailsError && error.status === 401) {
        router.refresh()
      }
    },
  })

  const unlinkMutation = useMutation<POSTV1BBatonUnlinkResponse, unknown, { password: string; token?: string }>({
    mutationFn: async ({ password, token }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/unlink`

      const { data } = await fetchWithErrorHandling<POSTV1BBatonUnlinkResponse>(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...(token ? { token } : {}) }),
      })

      return data
    },
    onSuccess: () => {
      toast.success('연동이 해제됐어요')
      unlinkFormRef.current?.reset()
      router.refresh()
    },
    onError: (error) => {
      if (error instanceof ProblemDetailsError && error.status === 401) {
        router.refresh()
      }
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

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 space-y-3">
        <p className="text-sm text-zinc-400">
          성인 콘텐츠를 안전하게 제공하기 위해 <span className="text-zinc-200">성인 여부 확인</span>이 필요할 수 있어요.
        </p>

        <div className="grid gap-2">
          <details className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
                <div className="text-sm font-medium text-zinc-200">왜 성인 인증이 필요한가요?</div>
                <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
              </div>
            </summary>
            <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2 text-sm text-zinc-400">
              <p>
                대한민국에서는 청소년에게 유해하다고 판단되는 콘텐츠(청소년유해매체물 등)에 대해 청소년 보호를 위한
                조치가 요구될 수 있어요. 이에 불필요하게 많은 개인정보를 받기보다는,{' '}
                <span className="text-zinc-200">성인인지 아닌지</span>를 확인하는 방식으로 접근을 제한하려고 해요.
              </p>
              <p className="text-xs text-zinc-500">북마크/평점/서재 등 사용자 상호작용 기능은 성인 인증이 필요해요.</p>
            </div>
          </details>

          <details className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
                <div className="text-sm font-medium text-zinc-200">인증은 어떻게 진행돼요?</div>
                <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
              </div>
            </summary>
            <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3">
              <ol className="text-sm text-zinc-400 list-decimal list-inside space-y-1">
                <li>버튼을 누르면 비바톤 인증 페이지가 새 창(팝업)으로 열려요.</li>
                <li>비바톤에서 성인 여부 확인을 완료하면 결과가 리토미로 전달돼요.</li>
                <li>성공하면 현재 화면의 상태가 자동으로 갱신돼요.</li>
              </ol>
            </div>
          </details>

          <details className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
                <div className="text-sm font-medium text-zinc-200">어떤 정보가 저장되나요?</div>
                <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
              </div>
            </summary>
            <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2">
              <p className="text-sm text-zinc-400">
                비바톤 인증을 완료하면 인증 상태를 유지하기 위해 <span className="text-zinc-200">아래 정보</span>를
                저장해요. 저장된 정보는 프로필이나 공개 화면에 표시되지 않아요.
              </p>
              <ul className="text-sm text-zinc-400 list-disc list-inside space-y-1">
                <li>비바톤 사용자 ID(연동 식별용)</li>
                <li>성인 여부(Y/N), 마지막 인증 시각</li>
              </ul>
              <p className="text-xs text-zinc-500">
                비바톤 로그인 정보(아이디/비밀번호)는 저장되지 않아요. 비바톤 연동 해제는 비밀번호(및 2단계 인증)로
                보호돼요. 비바톤 연동 해제 시 리토미에 저장된 인증 정보가 영구적으로 삭제돼요.
              </p>
            </div>
          </details>

          <details className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
                <div className="text-sm font-medium text-zinc-200">자주 묻는 질문</div>
                <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
              </div>
            </summary>
            <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2 text-sm text-zinc-400">
              <div className="space-y-1">
                <div className="font-medium text-zinc-300">팝업이 열리지 않아요</div>
                <p className="text-zinc-400">브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요.</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-zinc-300">인증이 갑자기 취소됐어요</div>
                <p className="text-zinc-400">인증 창을 닫았거나, 인증이 완료되기 전에 창이 종료되면 취소로 처리돼요.</p>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-zinc-300">이미 다른 계정에 연결돼 있다고 나와요</div>
                <p className="text-zinc-400">
                  하나의 비바톤 계정은 하나의 리토미 계정에만 연결할 수 있어요. 기존 계정에서 연동을 해제한 뒤 다시
                  시도해 주세요.
                </p>
              </div>
            </div>
          </details>

          <details className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 transition hover:bg-zinc-900/40 active:bg-zinc-900/60">
                <div className="text-sm font-medium text-zinc-200">관련 법령 · 출처</div>
                <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
              </div>
            </summary>
            <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3 space-y-2">
              <p className="text-sm text-zinc-400">
                이 정보는 2025-12-15 기준으로 작성된 요약이에요. 법적 효력을 갖는 유권해석이 아니며, 구체적인 적용은
                상황에 따라 달라질 수 있어요.
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-zinc-500">
                <a
                  className="underline underline-offset-2 hover:text-zinc-300"
                  href="https://easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=718&ccfNo=2&cciNo=2&cnpClsNo=3"
                  rel="noreferrer"
                  target="_blank"
                >
                  법제처 찾기 쉬운 생활법령정보 (청소년유해매체물)
                </a>
                <a
                  className="underline underline-offset-2 hover:text-zinc-300"
                  href="https://bauth.bbaton.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  비바톤 인증 페이지
                </a>
              </div>
            </div>
          </details>
        </div>
      </div>

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
