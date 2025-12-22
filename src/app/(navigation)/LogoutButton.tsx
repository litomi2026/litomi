'use client'

import { sendGAEvent } from '@next/third-parties/google'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

import logout from '@/app/auth/logout/action'
import { NEXT_PUBLIC_GA_ID } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import useServerAction from '@/hook/useServerAction'
import amplitude from '@/lib/amplitude/lazy'

export default function LogoutButton() {
  const queryClient = useQueryClient()

  const [_, dispatchAction, isPending] = useServerAction({
    action: logout,
    onSuccess: ({ loginId }) => {
      toast.success(`${loginId} 계정에서 로그아웃했어요`)
      amplitude.track('logout')
      amplitude.reset()
      sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: null })
      sendGAEvent('event', 'logout')
      queryClient.setQueryData(QueryKeys.me, null)

      queryClient.removeQueries({
        queryKey: QueryKeys.me,
        predicate: (query) => query.queryKey.length > 1,
      })
    },
    shouldSetResponse: false,
  })

  return (
    <button
      className="group rounded-full p-2 w-full text-red-500 text-sm font-semibold transition whitespace-nowrap
        hover:bg-red-500/20 active:scale-95 
          disabled:hover:bg-inherit disabled:active:scale-100  disabled:text-zinc-400 sm:px-3 sm:py-2"
      disabled={isPending}
      onClick={dispatchAction}
      type="button"
    >
      <div className="flex justify-center items-center gap-3">
        <LogOut className="w-5 transition group-disabled:scale-100" />
        <span className="min-w-0 hidden md:block">로그아웃</span>
      </div>
    </button>
  )
}
