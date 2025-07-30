'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useTransition } from 'react'
import { toast } from 'sonner'

import logout from '@/app/auth/logout/action'
import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/lazy'

import IconLogout from '../icons/IconLogout'

type Props = {
  className?: string
}

export default function LogoutButton({ className = '' }: Readonly<Props>) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  const handleLogout = async () => {
    startTransition(async () => {
      const response = await logout()

      if (response.ok) {
        toast.success(`${response.data.loginId} 계정에서 로그아웃했어요`)
        amplitude.track('logout')
        amplitude.reset()
        queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
      } else {
        toast.error(response.error)
      }
    })
  }

  return (
    <form action={handleLogout} className={`relative whitespace-nowrap aria-hidden:hidden ${className}`}>
      <button
        className="group rounded-full p-2 w-full text-red-500 text-sm font-semibold transition hover:bg-red-500/20 active:scale-95 
          disabled:hover:bg-inherit disabled:active:scale-100  disabled:text-zinc-400 sm:px-3 sm:py-2"
        disabled={isPending}
        type="submit"
      >
        <div className="flex justify-center items-center gap-3">
          <IconLogout className="w-5 transition group-disabled:scale-100" />
          <span className="min-w-0 hidden md:block">로그아웃</span>
        </div>
      </button>
    </form>
  )
}
