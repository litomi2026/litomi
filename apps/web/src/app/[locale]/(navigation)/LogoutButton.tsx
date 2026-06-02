'use client'

import { LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { identify, track } from '@/lib/analytics/browser'
import useLogoutMutation from '@/query/useLogoutMutation'

type Props = {
  username: string
}

export default function LogoutButton({ username }: Props) {
  const { mutate: logout, isPending } = useLogoutMutation()
  const t = useTranslations('Profile.navigation')
  const logoutLabel = t('logout', { name: username })

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
      aria-label={logoutLabel}
      className={twMerge(
        'flex items-center gap-3 group rounded-full p-2 w-full text-red-500 text-sm font-semibold transition whitespace-nowrap',
        'hover:bg-red-500/20 active:scale-95',
        'disabled:hover:bg-inherit disabled:active:scale-100  disabled:text-zinc-400 sm:px-3 sm:py-2',
      )}
      disabled={isPending}
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="w-5 transition group-disabled:scale-100" />
      <span className="min-w-0 hidden md:block">{logoutLabel}</span>
    </button>
  )
}
