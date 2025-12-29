'use client'

import dayjs from 'dayjs'
import { Monitor, Smartphone, Tablet, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import useServerAction from '@/hook/useServerAction'
import { formatDistanceToNow } from '@/utils/format/date'

import { revokeAllTrustedBrowsers, revokeTrustedBrowser } from '../action-trusted-browser'

type Props = {
  trustedBrowsers: TrustedBrowser[]
}

type TrustedBrowser = {
  id: number
  browserName: string | null
  lastUsedAt: Date | null
  createdAt: Date
  expiresAt: Date
  isCurrentBrowser: boolean
}

export default function TrustedBrowsers({ trustedBrowsers }: Props) {
  const [browsers, setBrowsers] = useState<TrustedBrowser[]>(trustedBrowsers)

  const [, dispatchRevokeSingle, isRevokingSingle] = useServerAction({
    action: revokeTrustedBrowser,
    onSuccess: (_, [formData]) => {
      const trustedBrowserId = Number(formData.get('trustedBrowserId'))
      setBrowsers((prev) => prev.filter((d) => d.id !== trustedBrowserId))
      toast.success('브라우저가 제거됐어요')
    },
  })

  const [, dispatchRevokeAll, isRevokingAll] = useServerAction({
    action: revokeAllTrustedBrowsers,
    onSuccess: () => {
      setBrowsers([])
      toast.success('모든 브라우저가 제거됐어요')
    },
  })

  function handleRevokeDevice(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('해당 브라우저를 신뢰 목록에서 제거할까요?')) {
      e.preventDefault()
    }
  }

  function handleRevokeAll(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('모든 브라우저를 신뢰 목록에서 제거할까요? 다음 로그인 시 모든 브라우저에서 2단계 인증이 필요해요.')) {
      e.preventDefault()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">신뢰하는 브라우저</h3>
          <p className="mt-1 text-sm text-zinc-400">신뢰하는 브라우저에서는 2단계 인증 없이 로그인할 수 있어요</p>
        </div>
        {browsers.length > 0 && (
          <form action={dispatchRevokeAll} className="shrink-0" onSubmit={handleRevokeAll}>
            <button
              className="text-sm text-red-400 hover:text-red-300 transition disabled:opacity-50"
              disabled={isRevokingAll}
              type="submit"
            >
              {isRevokingAll ? <IconSpinner className="size-4" /> : '모두 제거'}
            </button>
          </form>
        )}
      </div>

      {browsers.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-zinc-400">신뢰하는 브라우저가 없어요</p>
          <p className="mt-2 text-xs text-zinc-500">2단계 인증 시 "이 브라우저 신뢰" 옵션을 선택하면 여기에 표시돼요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {browsers.map((browser) => {
            const { browserName, lastUsedAt, expiresAt, id, isCurrentBrowser } = browser
            const { lastUsed, expiresIn } = formatBrowserInfo(browser)

            return (
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
                          {lastUsed}
                          <span className="hidden sm:inline"> 사용</span>
                        </span>
                      )}
                      {lastUsedAt && <span>•</span>}
                      <span title={`${dayjs(expiresAt).format('YYYY년 M월 D일 HH:mm')} 만료`}>
                        {expiresIn}
                        <span className="hidden sm:inline"> 만료</span>
                      </span>
                    </div>
                  </div>
                </div>
                <form action={dispatchRevokeSingle} onSubmit={handleRevokeDevice}>
                  <input name="trustedBrowserId" type="hidden" value={id} />
                  <button
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 
                      disabled:opacity-50 transition"
                    disabled={isRevokingSingle}
                    title="제거"
                    type="submit"
                  >
                    {isRevokingSingle ? <IconSpinner className="size-4" /> : <Trash2 className="size-4" />}
                  </button>
                </form>
              </div>
            )
          })}
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

function formatBrowserInfo(browser: TrustedBrowser) {
  const lastUsed = browser.lastUsedAt ? formatDistanceToNow(new Date(browser.lastUsedAt)) : null
  const now = dayjs()
  const expiresAt = dayjs(browser.expiresAt)
  const daysUntilExpiry = expiresAt.diff(now, 'day')

  let expiresIn: string
  if (daysUntilExpiry <= 0) {
    expiresIn = '만료됨'
  } else if (daysUntilExpiry === 1) {
    expiresIn = '내일 만료'
  } else if (daysUntilExpiry < 7) {
    expiresIn = `${daysUntilExpiry}일 후`
  } else if (daysUntilExpiry < 30) {
    expiresIn = `${Math.floor(daysUntilExpiry / 7)}주 후`
  } else {
    expiresIn = `${Math.floor(daysUntilExpiry / 30)}달 후`
  }

  return {
    lastUsed,
    expiresIn,
  }
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
