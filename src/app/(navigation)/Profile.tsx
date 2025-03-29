'use client'

import Loading from '@/components/ui/Loading'
import { SessionStorageKey } from '@/constants/storage'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import IconLogin from '../../components/icons/IconLogin'
import IconLogout from '../../components/icons/IconLogout'
import IconMore from '../../components/icons/IconMore'
import SelectableLink from '../../components/SelectableLink'
import Squircle from '../../components/ui/Squircle'
import logout from '../auth/logout/action'

const initialState = {
  success: false,
}

export default function Profile() {
  const pathname = usePathname()
  const accessToken = '2'
  const [logoutState, formAction, pending] = useActionState(logout, initialState)

  useEffect(() => {
    const { error } = logoutState
    if (error) {
      toast.error(error)
    }
  }, [logoutState])

  const user = {
    id: '1',
    loginId: 'loginId',
    profileImageURLs: ['https://example.com/image.jpg'],
    nickname: 'nickname',
  }

  return accessToken ? (
    <Link
      className="relative flex items-center justify-center rounded-full sm:px-2 sm:py-4 2xl:px-0"
      href={`/@${user.loginId}`}
    >
      <Squircle src={user.profileImageURLs?.[0]} wrapperClassName="w-8 flex-shrink-0 sm:w-10">
        {user.nickname.slice(0, 2)}
      </Squircle>
      <div className="ml-3 hidden w-full min-w-0 gap-1 py-0.5 2xl:grid">
        <div className="overflow-hidden whitespace-nowrap leading-5">{user.nickname}</div>
        <div className="text-zinc-400 overflow-hidden text-ellipsis whitespace-nowrap leading-5">@{user.loginId}</div>
      </div>
      <form action={formAction} className="relative whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <label>
          <input
            className="hover:bg-zinc-500/40 peer absolute inset-0 appearance-none overflow-hidden rounded-full transition"
            type="checkbox"
          />
          <div
            className="pointer-events-none absolute -top-6 right-0 z-10 -translate-y-full rounded-2xl border p-4 opacity-0 shadow-lg transition 
            peer-checked:pointer-events-auto peer-checked:opacity-100 bg-zinc-900 "
          >
            <button
              className="group m-0 flex w-fit items-center gap-5 rounded-full p-3 text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-red-600 active:scale-90 disabled:text-gray-500 disabled:hover:bg-inherit disabled:active:scale-100 hover:dark:bg-red-500/20 focus:dark:outline-red-200 disabled:dark:text-gray-400"
              disabled={pending}
            >
              {pending ? (
                <Loading />
              ) : (
                <>
                  <IconLogout className="w-6 transition-transform group-hover:scale-110 group-disabled:scale-100" />
                  <span className="min-w-0">로그아웃</span>
                </>
              )}
            </button>
          </div>
          <IconMore className="relative hidden w-11 cursor-pointer p-3 2xl:block" />
        </label>
      </form>
    </Link>
  ) : (
    <SelectableLink
      className="sm:py-4"
      href="/auth/login"
      Icon={IconLogin}
      onClick={() => sessionStorage.setItem(SessionStorageKey.LOGIN_REDIRECTION, pathname)}
    >
      로그인
    </SelectableLink>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center justify-center sm:py-4">
      <Squircle wrapperClassName="w-8 animate-pulse flex-shrink-0 sm:w-10" />
      <div className="mx-3 hidden w-full min-w-0 gap-1 py-0.5 2xl:grid">
        <div className="h-5 animate-pulse rounded-xl dark:bg-zinc-800" />
        <div className="h-5 animate-pulse rounded-xl dark:bg-zinc-800" />
      </div>
    </div>
  )
}
