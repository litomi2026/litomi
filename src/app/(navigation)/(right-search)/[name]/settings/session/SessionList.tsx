'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Loader2, Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { DELETEV1MeSessionResponse } from '@/backend/api/v1/me/session'

import { QueryKeys } from '@/constants/query'
import { formatDistanceToNow } from '@/utils/format/date'
import { getDeviceInfo } from '@/utils/push-device'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { revokeAllPersistentSessions, revokeOtherPersistentSessions, revokePersistentSession } from './api'

export type PersistentSession = {
  id: string
  createdAt: Date
  lastUsedAt: Date
  idleExpiresAt: Date
  userAgent: string | null
  isCurrent: boolean
}

type Props = {
  hasCurrentPersistentSession: boolean
  sessions: PersistentSession[]
}

export default function SessionList({ sessions, hasCurrentPersistentSession }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const revokeSingleMutation = useMutation<DELETEV1MeSessionResponse, ProblemDetailsError, string>({
    mutationFn: revokePersistentSession,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const revokeOthersMutation = useMutation<DELETEV1MeSessionResponse, ProblemDetailsError>({
    mutationFn: revokeOtherPersistentSessions,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const revokeAllMutation = useMutation<DELETEV1MeSessionResponse, ProblemDetailsError>({
    mutationFn: revokeAllPersistentSessions,
    onSuccess: handleSuccess,
    onError: handleError,
  })

  function handleSuccess(data: DELETEV1MeSessionResponse) {
    if (data.clearedCurrentSession) {
      clearMeCache(queryClient)
    }

    toast.success(data.message)
    router.refresh()
  }

  function handleError(error: ProblemDetailsError) {
    if (error.status === 401) {
      clearMeCache(queryClient)
      router.refresh()
    }

    toast.error(error.message)
  }

  function handleRevokeSession(familyId: string) {
    if (!confirm('이 로그인 유지 세션을 종료할까요?')) {
      return
    }

    revokeSingleMutation.mutate(familyId)
  }

  function handleRevokeOthers() {
    const confirmed = confirm(
      hasCurrentPersistentSession
        ? '현재 세션을 제외한 다른 로그인 유지 세션을 모두 종료할까요?'
        : '현재 기기의 로그인 유지 세션이 없어서 모든 로그인 유지 세션을 종료해요. 계속할까요?',
    )

    if (!confirmed) {
      return
    }

    revokeOthersMutation.mutate()
  }

  function handleRevokeAll() {
    if (!confirm('모든 로그인 유지 세션을 종료할까요? 현재 기기에서도 다시 로그인해야 해요.')) {
      return
    }

    revokeAllMutation.mutate()
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-6 text-center">
          <p className="text-sm text-zinc-300">로그인 유지 세션이 없어요</p>
          <p className="mt-2 text-xs text-zinc-500">이 목록에는 로그인 유지 옵션으로 만든 세션만 표시돼요</p>
        </div>
        <SessionHint hasCurrentPersistentSession={hasCurrentPersistentSession} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">로그인 유지 세션</h3>
          <p className="mt-1 text-sm text-zinc-400">기억된 브라우저와 기기에서의 로그인 상태를 관리해요</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
            disabled={revokeOthersMutation.isPending}
            onClick={handleRevokeOthers}
            type="button"
          >
            {revokeOthersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : '다른 세션 모두 종료'}
          </button>
          <button
            className="rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
            disabled={revokeAllMutation.isPending}
            onClick={handleRevokeAll}
            type="button"
          >
            {revokeAllMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : '모든 세션 종료'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => {
          const { createdLabel, deviceLabel, expiresLabel, icon, lastUsedLabel } = formatSessionInfo(session)

          return (
            <div
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              key={session.id}
            >
              <div className="flex items-center gap-3">
                <div className="text-zinc-400">{icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 font-medium text-zinc-200">{deviceLabel}</span>
                    {session.isCurrent && (
                      <span className="shrink-0 rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">
                        현재
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span
                      className="text-zinc-400"
                      title={`${dayjs(session.lastUsedAt).format('YYYY년 M월 D일 HH:mm')} 사용`}
                    >
                      {lastUsedLabel} 사용
                    </span>
                    <span>•</span>
                    <span title={`${dayjs(session.createdAt).format('YYYY년 M월 D일 HH:mm')} 생성`}>
                      {createdLabel}
                    </span>
                    <span>•</span>
                    <span title={`${dayjs(session.idleExpiresAt).format('YYYY년 M월 D일 HH:mm')} 만료`}>
                      {expiresLabel}
                    </span>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                  disabled={revokeSingleMutation.isPending}
                  onClick={() => handleRevokeSession(session.id)}
                  title="세션 종료"
                  type="button"
                >
                  {revokeSingleMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <SessionHint hasCurrentPersistentSession={hasCurrentPersistentSession} />
    </div>
  )
}

function clearMeCache(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.setQueryData(QueryKeys.me, null)
  queryClient.removeQueries({
    queryKey: QueryKeys.me,
    predicate: (query) => query.queryKey.length > 1,
  })
}

function formatSessionInfo(session: PersistentSession) {
  const { browser, device, os } = session.userAgent
    ? getDeviceInfo(session.userAgent)
    : { browser: '알 수 없는 브라우저', os: '', device: '' }

  const deviceLabel = [browser, os, device].filter(Boolean).join(' ').trim() || '알 수 없는 브라우저'
  const lastUsedLabel = formatDistanceToNow(new Date(session.lastUsedAt))
  const createdLabel = `${dayjs(session.createdAt).format('YYYY년 M월 D일 HH:mm')} 생성`
  const idleExpiresAt = dayjs(session.idleExpiresAt)
  const hoursUntilExpiry = idleExpiresAt.diff(dayjs(), 'hour')

  let expiresLabel = '곧 만료'

  if (hoursUntilExpiry >= 24) {
    expiresLabel = `${Math.floor(hoursUntilExpiry / 24)}일 후 만료`
  } else if (hoursUntilExpiry >= 1) {
    expiresLabel = `${hoursUntilExpiry}시간 후 만료`
  }

  const icon = getDeviceIcon(deviceLabel)

  return {
    createdLabel,
    deviceLabel,
    expiresLabel,
    icon,
    lastUsedLabel,
  }
}

function getDeviceIcon(deviceName: string) {
  const name = deviceName.toLowerCase()

  if (name.includes('mobile') || name.includes('모바일') || name.includes('phone')) {
    return <Smartphone className="size-5" />
  }

  if (name.includes('tablet') || name.includes('ipad')) {
    return <Tablet className="size-5" />
  }

  return <Monitor className="size-5" />
}

function SessionHint({ hasCurrentPersistentSession }: { hasCurrentPersistentSession: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="mb-2 text-sm font-medium text-zinc-300">안내</h4>
      <ul className="space-y-1 text-xs text-zinc-400">
        <li>• 이 목록에는 로그인 유지 옵션으로 발급된 세션만 표시돼요</li>
        {!hasCurrentPersistentSession && <li>• 현재 로그인은 로그인 유지를 사용하지 않아 목록에 표시되지 않아요</li>}
        <li>• 다른 기기 세션을 종료해도 이미 발급된 접근 토큰은 최대 1시간까지 유지될 수 있어요</li>
      </ul>
    </div>
  )
}
