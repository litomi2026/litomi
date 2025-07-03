'use client'

import * as amplitude from '@amplitude/analytics-browser'
import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import logout from '@/app/auth/logout/action'
import { QueryKeys } from '@/constants/query'
import useActionErrorEffect from '@/hook/useActionErrorEffect'
import useMeQuery from '@/query/useMeQuery'

import IconLogout from '../icons/IconLogout'
import Loading from '../ui/Loading'

const initialState = {
  success: false,
}

type Props = {
  className?: string
}

export default function LogoutButton({ className = '' }: Props) {
  const [{ error, success, status }, formAction, pending] = useActionState(logout, initialState)
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const myId = me?.id

  useEffect(() => {
    if (success) {
      toast.success('로그아웃 성공')
      if (myId) amplitude.track('logout', { userId: myId })
      amplitude.reset()
      queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
    }
  }, [myId, queryClient, success])

  useActionErrorEffect({
    status,
    error,
    onError: (error) => toast.error(error),
  })

  return (
    <form
      action={formAction}
      aria-hidden={!me}
      className={`relative whitespace-nowrap aria-hidden:hidden ${className}`}
    >
      <button
        className="group rounded-full p-2 w-full text-red-500 text-sm font-semibold transition hover:bg-red-500/20 active:scale-95 
          disabled:hover:bg-inherit disabled:active:scale-100  disabled:text-zinc-400 sm:px-3 sm:py-2"
        disabled={pending}
      >
        {pending ? (
          <div className="h-6 w-full">
            <Loading className="w-6 -translate-x-1 text-current mx-auto translate-y-2.5" />
          </div>
        ) : (
          <div className="flex justify-center items-center gap-3">
            <IconLogout className="w-5 transition group-disabled:scale-100" />
            <span className="min-w-0 hidden md:block">로그아웃</span>
          </div>
        )}
      </button>
    </form>
  )
}

export function LogoutButtonError({ error, reset }: ErrorBoundaryFallbackProps) {
  useEffect(() => {
    captureException(error, { extra: { name: 'LogoutButtonError' } })
  }, [error])

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
  return <div className="w-9 h-9 animate-fade-in bg-zinc-800 rounded-full md:w-26" />
}
