'use client'

import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { identify, track } from '@/lib/analytics/browser'
import useLogoutMutation from '@/query/useLogoutMutation'

export default function LogoutButton() {
  const { mutate: logout, isPending } = useLogoutMutation()
  const t = useTranslations('Profile.navigation')

  function handleLogout() {
    logout(undefined, {
      onSuccess: ({ loginId }) => {
        toast.info(loginId ? `${loginId} 계정에서 로그아웃했어요` : '로그아웃했어요')
        identify(null)
        track('logout')
      },
    })
  }

  return (
    <button
      className={twMerge(
        'group rounded-full p-2 w-full text-red-500 text-sm font-semibold transition whitespace-nowrap',
        'hover:bg-red-500/20 active:scale-95',
        'disabled:hover:bg-inherit disabled:active:scale-100  disabled:text-zinc-400 sm:px-3 sm:py-2',
      )}
      disabled={isPending}
      onClick={handleLogout}
      type="button"
    >
      <div className="flex justify-center items-center gap-3">
        <LogOut className="w-5 transition group-disabled:scale-100" />
        <span className="min-w-0 hidden md:block">{t('logout')}</span>
      </div>
    </button>
  )
}
