'use client'

import { LogOut } from 'lucide-react'
import { toast } from 'sonner'

import amplitude from '@/lib/amplitude/browser'
import { identify, track } from '@/lib/analytics/browser'
import useLogoutMutation from '@/query/useLogoutMutation'

export default function LogoutButton() {
  const { mutate: logout, isPending } = useLogoutMutation()

  function handleLogout() {
    logout(undefined, {
      onSuccess: ({ loginId }) => {
        toast.info(loginId ? `${loginId} 계정에서 로그아웃했어요` : '로그아웃했어요')
        amplitude.track('logout')
        amplitude.reset()
        identify(null)
        track('logout')
      },
      onError: (error) => {
        toast.error(error.message || '로그아웃 중 오류가 발생했어요')
      },
    })
  }

  return (
    <button
      className="group rounded-full p-2 w-full text-red-500 text-sm font-semibold transition whitespace-nowrap
        hover:bg-red-500/20 active:scale-95 
          disabled:hover:bg-inherit disabled:active:scale-100  disabled:text-zinc-400 sm:px-3 sm:py-2"
      disabled={isPending}
      onClick={handleLogout}
      type="button"
    >
      <div className="flex justify-center items-center gap-3">
        <LogOut className="w-5 transition group-disabled:scale-100" />
        <span className="min-w-0 hidden md:block">로그아웃</span>
      </div>
    </button>
  )
}
