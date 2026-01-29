'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { POSTV1BBatonAttemptResponse } from '@/backend/api/v1/bbaton/attempt'
import { BBATON_POPUP_WINDOW_NAME } from '@/constants/bbaton'
import { QueryKeys } from '@/constants/query'
import { LocalStorageKey } from '@/constants/storage'
import { env } from '@/env/client'
import BBatonButton from '@/svg/BBatonButton'
import { formatDistanceToNow } from '@/utils/format/date'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

import AdultVerificationHelp from './AdultVerificationHelp'
import BBatonUnlinkSection from './BBatonUnlinkSection'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Props = {
  initialVerification?: {
    adultFlag: boolean
    verifiedAt: Date | null
  }
  isTwoFactorEnabled: boolean
}

export default function AdultVerificationSectionClient({ initialVerification, isTwoFactorEnabled }: Props) {
  const [needsManualRefresh, setNeedsManualRefresh] = useState(false)
  const [pendingToast, setPendingToast] = useState<{ previousVerifiedAtMs: number | null } | null>(null)
  const [isVerifyingUI, setIsVerifyingUI] = useState(false)

  const router = useRouter()
  const queryClient = useQueryClient()
  const popupRef = useRef<Window | null>(null)
  const isVerifyingRef = useRef(false)
  const focusHandlerRef = useRef<(() => void) | null>(null)
  const verifiedAt = initialVerification?.verifiedAt
  const verifiedAtLabel = verifiedAt ? formatDistanceToNow(new Date(verifiedAt)) : null
  const verifiedAtMs = verifiedAt instanceof Date ? verifiedAt.getTime() : null

  const status = useMemo(() => {
    if (!initialVerification) {
      return { label: '미인증', tone: 'zinc' }
    }
    if (initialVerification.adultFlag) {
      return { label: '성인', tone: 'green' }
    }
    return { label: '성인 아님', tone: 'red' }
  }, [initialVerification])

  const verifyMutation = useMutation<POSTV1BBatonAttemptResponse, unknown, void>({
    mutationFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bbaton/attempt`

      const { data } = await fetchWithErrorHandling<POSTV1BBatonAttemptResponse>(url, {
        method: 'POST',
        credentials: 'include',
      })

      const { authorizeUrl } = data
      const popup = window.open(authorizeUrl, BBATON_POPUP_WINDOW_NAME, 'width=420,height=580')

      if (!popup) {
        throw { status: 0, error: '팝업을 열 수 없어요. 팝업 차단을 해제해 주세요.' }
      }

      setIsVerifyingUI(true)
      isVerifyingRef.current = true
      popupRef.current = popup

      const onFocus = () => {
        const currentPopup = popupRef.current
        if (!currentPopup) {
          return
        }

        if (!isVerifyingRef.current) {
          return
        }

        if (!currentPopup.closed) {
          return
        }

        // NOTE: 콜백 팝업이 닫혔는데 신호(storage event)가 없으면 불확실 상태예요.
        // 서버 상태 조회 엔드포인트는 공격면 최소화를 위해 두지 않으니, 수동 새로고침으로 확인해요.
        setIsVerifyingUI(false)
        isVerifyingRef.current = false
        popupRef.current = null

        if (focusHandlerRef.current) {
          window.removeEventListener('focus', focusHandlerRef.current)
          focusHandlerRef.current = null
        }

        setNeedsManualRefresh(true)
        toast.warning('인증 완료 여부를 확인하려면 상태 새로고침을 눌러 주세요')
      }

      window.addEventListener('focus', onFocus)
      focusHandlerRef.current = onFocus

      return data
    },
    onSuccess: () => {},
    onError: (error) => {
      setIsVerifyingUI(false)
      isVerifyingRef.current = false
      toast.error(getErrorMessage(error))
      if (error instanceof ProblemDetailsError && error.status === 401) {
        router.refresh()
      }
    },
  })

  function startVerification() {
    if (!verifyMutation.isPending && !isVerifyingUI) {
      setNeedsManualRefresh(false)
      verifyMutation.mutate()
    }
  }

  function refreshStatus() {
    queryClient.invalidateQueries({ queryKey: QueryKeys.me, exact: true })
    router.refresh()
  }

  // NOTE: 콜백 팝업이 localStorage에 완료 신호를 남기면, 모든 탭에서 storage 이벤트로 감지해 페이지를 새로고침해요
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LocalStorageKey.BBATON_ADULT_VERIFICATION_SIGNAL) {
        return
      }

      if (!event.newValue) {
        return
      }

      const payload = safeParseJSON<{ type?: unknown; at?: unknown }>(event.newValue)
      if (!payload || payload.type !== 'complete') {
        return
      }

      setNeedsManualRefresh(false)
      setIsVerifyingUI(false)
      isVerifyingRef.current = false

      setPendingToast({ previousVerifiedAtMs: verifiedAtMs })

      if (focusHandlerRef.current) {
        window.removeEventListener('focus', focusHandlerRef.current)
        focusHandlerRef.current = null
      }

      popupRef.current = null
      queryClient.invalidateQueries({ queryKey: QueryKeys.me, exact: true })
      router.refresh()
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [router, verifiedAtMs])

  // NOTE: refresh 후 서버에서 내려온 상태(성인/성인 아님)로 토스트를 결정해요
  useEffect(() => {
    if (!pendingToast) {
      return
    }

    const currentVerifiedAtMs =
      initialVerification?.verifiedAt instanceof Date ? initialVerification.verifiedAt.getTime() : null

    const updated =
      currentVerifiedAtMs != null &&
      (pendingToast.previousVerifiedAtMs == null || currentVerifiedAtMs > pendingToast.previousVerifiedAtMs)

    if (!updated) {
      return
    }

    if (initialVerification?.adultFlag) {
      toast.success('성인 인증이 완료됐어요')
    } else {
      toast.success('인증 결과가 저장됐어요', { description: '성인으로 확인되지 않았어요' })
    }

    setPendingToast(null)
  }, [initialVerification, pendingToast])

  // NOTE: 인증 플로우에서 등록한 focus 이벤트 핸들러가 남지 않도록 언마운트 시 정리해요
  useEffect(() => {
    return () => {
      if (focusHandlerRef.current) {
        window.removeEventListener('focus', focusHandlerRef.current)
        focusHandlerRef.current = null
      }
    }
  }, [])

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
        aria-disabled={verifyMutation.isPending || isVerifyingUI}
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

function safeParseJSON<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}
