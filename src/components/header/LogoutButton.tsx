'use client'

import logout from '@/app/auth/logout/action'
import { QueryKeys } from '@/constants/query'
import useMeQuery from '@/query/useMeQuery'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import IconLogout from '../icons/IconLogout'
import Loading from '../ui/Loading'

const initialState = {
  success: false,
}

type Props = {
  className?: string
}

export default function LogoutButton({ className = '' }: Props) {
  const [logoutState, formAction, pending] = useActionState(logout, initialState)
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()

  useEffect(() => {
    const { error, success } = logoutState
    if (error) {
      toast.error(error)
    } else if (success) {
      queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
      toast.success('로그아웃 성공')
    }
  }, [logoutState, queryClient])

  return (
    <form
      action={formAction}
      aria-hidden={!me}
      className={`relative whitespace-nowrap aria-hidden:hidden ${className}`}
    >
      <button
        className="group rounded-full p-3 text-red-500 transition hover:bg-red-500/20 active:scale-95 
          disabled:hover:bg-inherit disabled:active:scale-100  disabled:text-zinc-400"
        disabled={pending}
      >
        {pending ? (
          <div className="h-6">
            <Loading className="w-6 -translate-x-1 translate-y-2.5" />
          </div>
        ) : (
          <div className="flex items-center gap-5 ">
            <IconLogout className="w-6 transition group-disabled:scale-100" />
            <span className="min-w-0 hidden md:block">로그아웃</span>
          </div>
        )}
      </button>
    </form>
  )
}

export function LogoutButtonError({ reset }: { reset: () => void }) {
  return (
    <button
      className="flex items-center gap-3 rounded-full p-3 text-red-500 transition hover:bg-red-500/20 active:scale-95"
      onClick={reset}
      type="reset"
    >
      <IconLogout className="w-6 transition group-disabled:scale-100" />
      <span className="min-w-0 hidden md:block">오류 (재시도)</span>
    </button>
  )
}

export function LogoutButtonSkeleton() {
  return <div className="w-10 h-10 m-1 animate-fade-in duration-1000 bg-zinc-800 rounded-full md:w-30" />
}
