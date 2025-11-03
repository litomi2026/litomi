'use client'

import { useQueryClient } from '@tanstack/react-query'
import { BellRing } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'

import { testNotification } from './action'
import { getCurrentBrowserEndpoint } from './common'

type Props = {
  endpoints: string[]
}

export default function PushTestButton({ endpoints }: Props) {
  const [hasTestedOnce, setHasTestedOnce] = useState(false)
  const queryClient = useQueryClient()

  const [_, dispatchTestNotification, isPending] = useActionResponse({
    action: testNotification,
    onSuccess: (data) => {
      toast.success(data)
      setHasTestedOnce(true)
      queryClient.invalidateQueries({ queryKey: QueryKeys.notification })
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
        bg-zinc-800 hover:from-zinc-700 hover:to-zinc-700/70
        border border-zinc-700/50 hover:border-zinc-600
        text-zinc-200 hover:text-foreground transition
        shadow-sm hover:shadow-md hover:shadow-zinc-900/50
        disabled:opacity-50 active:scale-98"
      disabled={isPending}
      onClick={handleTestNotification}
      type="button"
    >
      <div className="relative">
        <BellRing className={`w-4 h-4 shrink-0 ${hasTestedOnce ? 'text-brand/70' : ''}`} />
        {!hasTestedOnce && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand rounded-full animate-pulse" />}
      </div>
      <span className="whitespace-nowrap">{hasTestedOnce ? '다시 보내기' : '알림 보내기'}</span>
    </button>
  )
}
