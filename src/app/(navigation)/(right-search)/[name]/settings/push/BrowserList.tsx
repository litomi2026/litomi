'use client'

import dayjs from 'dayjs'
import { Monitor, Smartphone, Trash2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import useActionResponse from '@/hook/useActionResponse'
import { getUsernameFromParam } from '@/utils/param'
import { formatDeviceInfo } from '@/utils/push-device'

import { Params } from '../../common'
import { removeDevice } from './action'
import { getCurrentBrowserEndpoint } from './common'

type Props = {
  webPushes: {
    id: number
    endpoint: string
    userAgent: string | null
    createdAt: Date
  }[]
}

export default function BrowserList({ webPushes }: Props) {
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null)
  const { name } = useParams<Params>()
  const username = getUsernameFromParam(name)

  const [_, dispatchRemoveDevice] = useActionResponse({
    action: removeDevice,
    onSuccess: (data) => {
      toast.success(data)
    },
  })

  async function handleRemoveDevice(deviceId: number) {
    if (!username) {
      return
    }

    if (!confirm('이 브라우저의 푸시 알림을 비활성화하시겠어요?')) {
      return
    }

    dispatchRemoveDevice({ deviceId, username })
  }

  // NOTE: 현재 브라우저 푸시 정보 가져오기
  useEffect(() => {
    getCurrentBrowserEndpoint().then((endpoint) => setCurrentEndpoint(endpoint))
  }, [webPushes])

  if (webPushes.length === 0) {
    return (
      <div className="text-center py-3 text-sm text-zinc-500">
        <Monitor className="w-8 h-8 mx-auto mb-2 opacity-30" />
        등록된 브라우저가 없어요
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {webPushes.map((webPush) => {
        const isCurrentDevice = webPush.endpoint === currentEndpoint
        const isMobile = webPush.userAgent?.includes('Mobile') ?? false

        return (
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              isCurrentDevice
                ? 'bg-linear-to-r from-zinc-800/50 to-zinc-800/30 border-brand-end/20'
                : 'bg-zinc-800/30 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
            }`}
            key={webPush.id}
          >
            <div className="flex items-center gap-3.5">
              {isMobile ? (
                <Smartphone
                  className={`w-4 h-4 p-2 rounded-lg box-content ${isCurrentDevice ? 'text-brand-end bg-brand-end/10' : 'text-zinc-400 bg-zinc-800/50'}`}
                />
              ) : (
                <Monitor
                  className={`w-4 h-4 p-2 rounded-lg box-content ${isCurrentDevice ? 'text-brand-end bg-brand-end/10' : 'text-zinc-400 bg-zinc-800/50'}`}
                />
              )}
              <div>
                <div className="text-sm text-zinc-200 flex items-center gap-2">
                  <span className="font-medium">{formatDeviceInfo(webPush.userAgent)}</span>
                  {isCurrentDevice && (
                    <span className="text-[10px] whitespace-nowrap font-medium text-brand-end bg-brand-end/10 px-1.5 rounded-full border border-brand-end/20">
                      현재
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  {dayjs(webPush.createdAt).format('YYYY년 M월 D일 HH:mm')}
                </div>
              </div>
            </div>
            {!isCurrentDevice && (
              <button
                aria-label="기기 제거"
                className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                onClick={() => handleRemoveDevice(webPush.id)}
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
