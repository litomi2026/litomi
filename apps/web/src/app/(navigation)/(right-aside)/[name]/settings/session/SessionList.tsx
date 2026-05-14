'use client'

import { QueryKeys } from '@litomi/domain/constants/query'
import { formatDistanceToNow } from '@litomi/std/format/date'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Loader2, LogOut, Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import type { DELETEV1MeSessionResponse } from '@/backend/api/v1/me/session'

import { ProblemDetailsError } from '@/utils/react-query-error'

import { revokeAllPersistentSessions, revokeOtherPersistentSessions, revokePersistentSession } from './api'

export type PersistentSession = {
  id: string
  createdAt: Date
  lastUsedAt: Date
  idleExpiresAt: Date
  deviceLabel: string | null
  isCurrent: boolean
}

type Props = {
  hasCurrentPersistentSession: boolean
  sessions: PersistentSession[]
}

export default function SessionList({ sessions, hasCurrentPersistentSession }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const revokeOthersLabel = hasCurrentPersistentSession ? '다른 기기 로그아웃' : '표시된 기기 모두 로그아웃'

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
    if (!confirm('이 기기에서 로그아웃할까요?')) {
      return
    }

    revokeSingleMutation.mutate(familyId)
  }

  function handleRevokeOthers() {
    const confirmed = confirm(
      hasCurrentPersistentSession
        ? '이 기기를 제외한 다른 기기에서 모두 로그아웃할까요?'
        : '지금 사용 중인 기기는 목록에 없어요. 계속하면 표시된 기기에서 모두 로그아웃돼요. 계속할까요?',
    )

    if (!confirmed) {
      return
    }

    revokeOthersMutation.mutate()
  }

  function handleRevokeAll() {
    if (!confirm('모든 기기에서 로그아웃할까요? 지금 사용 중인 기기에서도 다시 로그인해야 해요.')) {
      return
    }

    revokeAllMutation.mutate()
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-6 text-center">
          <p className="text-sm text-zinc-300">로그인 유지 중인 기기가 없어요</p>
          <p className="mt-2 text-xs text-zinc-500">여기에는 로그인 유지를 켠 기기만 보여요</p>
        </div>
        <SessionHint hasCurrentPersistentSession={hasCurrentPersistentSession} />
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
          disabled={revokeOthersMutation.isPending}
          onClick={handleRevokeOthers}
          type="button"
        >
          {revokeOthersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          {revokeOthersLabel}
        </button>
        <button
          className="flex items-center gap-2 rounded-lg border border-red-900/60 px-3 py-2 text-sm text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
          disabled={revokeAllMutation.isPending}
          onClick={handleRevokeAll}
          type="button"
        >
          {revokeAllMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          모두 로그아웃
        </button>
      </div>

      <div className="grid gap-2 sm:gap-3">
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
                      title={`마지막 사용: ${dayjs(session.lastUsedAt).format('YYYY년 M월 D일 HH:mm')}`}
                    >
                      {lastUsedLabel} 사용
                    </span>
                    <span>•</span>
                    <span title={`로그인 시작: ${dayjs(session.createdAt).format('YYYY년 M월 D일 HH:mm')}`}>
                      {createdLabel} 로그인
                    </span>
                    <span>•</span>
                    <span title={`자동 로그아웃: ${dayjs(session.idleExpiresAt).format('YYYY년 M월 D일 HH:mm')}`}>
                      {expiresLabel} 자동 로그아웃
                    </span>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <button
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                  disabled={revokeSingleMutation.isPending}
                  onClick={() => handleRevokeSession(session.id)}
                  title="로그아웃"
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
  const deviceLabel = session.deviceLabel?.trim() || '알 수 없는 기기'
  const lastUsedLabel = formatDistanceToNow(new Date(session.lastUsedAt))
  const createdLabel = formatDistanceToNow(new Date(session.createdAt))
  const idleExpiresAt = dayjs(session.idleExpiresAt)
  const hoursUntilExpiry = idleExpiresAt.diff(dayjs(), 'hour')

  let expiresLabel = '곧'

  if (hoursUntilExpiry >= 24) {
    expiresLabel = `${Math.floor(hoursUntilExpiry / 24)}일 후`
  } else if (hoursUntilExpiry >= 1) {
    expiresLabel = `${hoursUntilExpiry}시간 후`
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

  if (name.includes('tablet') || name.includes('ipad') || name.includes('태블릿')) {
    return <Tablet className="size-5" />
  }

  return <Monitor className="size-5" />
}

function SessionHint({ hasCurrentPersistentSession }: { hasCurrentPersistentSession: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="mb-2 text-sm font-medium text-zinc-300">알아두세요</h4>
      <ul className="space-y-1 text-xs text-zinc-400">
        <li>• 여기에는 로그인 유지를 켠 기기만 보여요</li>
        {!hasCurrentPersistentSession && <li>• 지금 사용 중인 기기는 로그인 유지를 켜지 않아 목록에 없어요</li>}
        <li>• 다른 기기를 로그아웃 시켜도, 그 기기에서 최대 1시간 동안은 계속 사용할 수 있어요</li>
      </ul>
    </div>
  )
}
