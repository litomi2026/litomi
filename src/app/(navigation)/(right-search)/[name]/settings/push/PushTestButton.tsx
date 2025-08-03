'use client'

import { BellRing } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import useActionResponse from '@/hook/useActionResponse'

import { testNotification } from './action'
import { getCurrentBrowserEndpoint } from './common'

type Props = {
  endpoints: string[]
}

export default function PushTestButton({ endpoints }: Props) {
  const [hasTestedOnce, setHasTestedOnce] = useState(false)

  const [_, dispatchTestNotification] = useActionResponse({
    action: testNotification,
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      }
    },
    onSuccess: (data) => {
      toast.success(data)
      setHasTestedOnce(true)
    },
    shouldSetResponse: false,
  })

  async function handleTestNotification() {
    const endpoint = await getCurrentBrowserEndpoint()

    if (!endpoint || !endpoints.includes(endpoint)) {
      toast.error('현재 브라우저에 알림이 활성화되어 있지 않아요')
      return
    }

    dispatchTestNotification({
      message: `${new Date().toLocaleString()}`,
      endpoint,
    })
  }

  return (
    <button
      className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg text-sm transition bg-zinc-900 hover:bg-zinc-800 
        border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white
        focus:outline-none focus:ring-2 focus:ring-brand-end/20 focus:ring-offset-2 focus:ring-offset-zinc-900"
      onClick={handleTestNotification}
      type="button"
    >
      <BellRing className="w-4 h-4" />
      <span>{hasTestedOnce ? '다시 보내기' : '알림 보내기'}</span>
    </button>
  )
}
