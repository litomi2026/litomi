import logout from '@/app/auth/logout/action'
import { QueryKeys } from '@/constants/query'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import IconLogout from '../icons/IconLogout'
import Loading from '../ui/Loading'

const initialState = {
  success: false,
}

export default function LogoutButton() {
  const [logoutState, formAction, pending] = useActionState(logout, initialState)
  const queryClient = useQueryClient()

  useEffect(() => {
    const { error, success } = logoutState
    if (error) {
      toast.error(error)
    } else if (success) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.me })
      toast.success('로그아웃 성공')
    }
  }, [logoutState, queryClient])

  return (
    <form action={formAction} className="relative whitespace-nowrap">
      <button
        className="group m-0 flex w-fit items-center gap-5 rounded-full p-3 text-red-500 transition-colors 
          hover:bg-red-500/20 active:scale-90 disabled:text-zinc-500 disabled:hover:bg-inherit disabled:active:scale-100  disabled:dark:text-zinc-400"
        disabled={pending}
      >
        {pending ? (
          <Loading />
        ) : (
          <>
            <IconLogout className="w-6 transition-transform group-disabled:scale-100" />
            <span className="min-w-0">로그아웃</span>
          </>
        )}
      </button>
    </form>
  )
}
