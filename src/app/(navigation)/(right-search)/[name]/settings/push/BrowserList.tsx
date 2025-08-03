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
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      }
    },
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
    return <div className="text-sm text-zinc-500">등록된 브라우저가 없어요</div>
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {webPushes.map((webPush) => {
          const isCurrentDevice = webPush.endpoint === currentEndpoint
          const isMobile = webPush.userAgent?.includes('Mobile') ?? false

          return (
            <div
              className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800"
              key={webPush.id}
            >
              <div className="flex items-center gap-3">
                {isMobile ? (
                  <Smartphone className="w-5 h-5 text-zinc-500" />
                ) : (
                  <Monitor className="w-5 h-5 text-zinc-500" />
                )}
                <div>
                  <div className="text-sm text-zinc-300 flex items-center gap-2">
                    {formatDeviceInfo(webPush.userAgent)}
                    {isCurrentDevice && (
                      <span className="text-xs whitespace-nowrap font-medium text-brand-end bg-brand-end/10 px-2 py-0.5 rounded-full">
                        현재
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    등록일: {dayjs(webPush.createdAt).format('YYYY. M. D. HH:mm')}
                  </div>
                </div>
              </div>
              {!isCurrentDevice && (
                <button
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
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
    </div>
  )
}
