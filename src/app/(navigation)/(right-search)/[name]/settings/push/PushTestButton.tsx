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
      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm font-medium
        bg-linear-to-r from-zinc-800 to-zinc-800/70 hover:from-zinc-700 hover:to-zinc-700/70
        border border-zinc-700/50 hover:border-zinc-600
        text-zinc-200 hover:text-white transition
        shadow-sm hover:shadow-md hover:shadow-zinc-900/50
        focus:outline-none focus:ring-2 focus:ring-brand-end/30 focus:border-brand-end/50
        active:scale-[0.98] touch-manipulation"
      onClick={handleTestNotification}
      type="button"
    >
      <div className="relative">
        <BellRing className={`w-4 h-4 shrink-0 ${hasTestedOnce ? 'text-brand-end/70' : ''}`} />
        {!hasTestedOnce && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-end rounded-full animate-pulse" />
        )}
      </div>
      <span className="whitespace-nowrap">{hasTestedOnce ? '다시 보내기' : '알림 보내기'}</span>
    </button>
  )
}
