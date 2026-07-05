'use client'

import type { DELETEV1MeTrustedBrowserResponse } from '@litomi/contracts'

import { formatDistanceFromNow, formatDistanceToNow } from '@litomi/std'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Loader2, Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import type { ProblemDetailsError } from '@/utils/fetch-response'
import { revokeAllTrustedBrowsers, revokeTrustedBrowser } from '../api'
import type { TrustedBrowser } from '../types'

type Props = {
  trustedBrowsers: TrustedBrowser[]
}

export default function TrustedBrowsers({ trustedBrowsers }: Props) {
  const locale = useLocale()
  const [browsers, setBrowsers] = useState<TrustedBrowser[]>(trustedBrowsers)

  const revokeSingleMutation = useMutation<DELETEV1MeTrustedBrowserResponse, ProblemDetailsError, number>({
    mutationFn: revokeTrustedBrowser,
    onSuccess: ({ id }) => {
      setBrowsers((prev) => prev.filter((browser) => browser.id !== id))
      toast.success('브라우저가 제거됐어요')
    },
  })

  const revokeAllMutation = useMutation<void, ProblemDetailsError>({
    mutationFn: revokeAllTrustedBrowsers,
    onSuccess: () => {
      setBrowsers([])
      toast.success('모든 브라우저가 제거됐어요')
    },
  })

  function handleRevokeDevice(id: number) {
    if (!confirm('해당 브라우저를 신뢰 목록에서 제거할까요?')) {
      return
    }

    revokeSingleMutation.mutate(id)
  }

  function handleRevokeAll() {
    if (!confirm('모든 브라우저를 신뢰 목록에서 제거할까요? 다음 로그인 시 모든 브라우저에서 2단계 인증이 필요해요.')) {
      return
    }

    revokeAllMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">신뢰하는 브라우저</h3>
          <p className="mt-1 text-sm text-zinc-400">신뢰하는 브라우저에서는 2단계 인증 없이 로그인할 수 있어요</p>
        </div>
        {browsers.length > 0 && (
          <div className="shrink-0">
            <button
              className="text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
              disabled={revokeAllMutation.isPending}
              onClick={handleRevokeAll}
              type="button"
            >
              {revokeAllMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : '모두 제거'}
            </button>
          </div>
        )}
      </div>

      {browsers.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-zinc-400">신뢰하는 브라우저가 없어요</p>
          <p className="mt-2 text-xs text-zinc-500">2단계 인증 시 "이 브라우저 신뢰" 옵션을 선택하면 여기에 표시돼요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {browsers.map(({ browserName, lastUsedAt, expiresAt, id, isCurrentBrowser }) => (
            <div
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              key={id}
            >
              <div className="flex items-center gap-3">
                <div className="text-zinc-400">{getDeviceIcon(browserName)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-200 line-clamp-1">
                      {browserName || '알 수 없는 브라우저'}
                    </span>
                    {isCurrentBrowser && (
                      <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400 shrink-0">
                        현재
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    {lastUsedAt && (
                      <span
                        className="text-zinc-400"
                        title={`${dayjs(lastUsedAt).format('YYYY년 M월 D일 HH:mm')} 사용`}
                      >
                        {formatDistanceToNow(new Date(lastUsedAt), locale)}
                        <span className="hidden sm:inline"> 사용</span>
                      </span>
                    )}
                    {lastUsedAt && <span>•</span>}
                    <span title={`${dayjs(expiresAt).format('YYYY년 M월 D일 HH:mm')} 만료`}>
                      {formatDistanceFromNow(new Date(expiresAt), locale) || '이미'}
                      <span className="hidden sm:inline"> 만료</span>
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <button
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50"
                  disabled={revokeSingleMutation.isPending}
                  onClick={() => handleRevokeDevice(id)}
                  title="제거"
                  type="button"
                >
                  {revokeSingleMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h4 className="mb-2 text-sm font-medium text-zinc-300">보안 팁</h4>
        <ul className="space-y-1 text-xs text-zinc-400">
          <li>• 신뢰하는 브라우저는 30일 후 자동으로 만료돼요</li>
          <li>• 최대 5개까지 브라우저를 신뢰할 수 있어요</li>
          <li>• 공용 컴퓨터에서는 이 옵션을 사용하지 마세요</li>
          <li>• 의심스러운 활동이 감지되면 즉시 모두 제거하세요</li>
        </ul>
      </div>
    </div>
  )
}

function getDeviceIcon(deviceName: string | null) {
  const name = deviceName?.toLowerCase() ?? ''

  if (name.includes('mobile') || name.includes('phone')) {
    return <Smartphone className="size-5" />
  } else if (name.includes('tablet') || name.includes('ipad')) {
    return <Tablet className="size-5" />
  }
  return <Monitor className="size-5" />
}
