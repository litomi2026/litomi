'use client'

import Loading from '@/components/ui/Loading'
import { SessionStorageKey } from '@/constants/storage'
import { locale } from 'dayjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useActionState } from 'react'

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
  const accessToken = ''
  const [{ success }, formAction, pending] = useActionState(logout, initialState)

  const user = {
    id: '1',
    loginId: 'loginId',
    profileImageURLs: ['https://example.com/image.jpg'],
    nickname: 'nickname',
  }

  return accessToken ? (
    <Link
      className="relative flex items-center justify-center rounded-full sm:px-2 sm:py-4 xl:px-0"
      href={`/${locale}/@${user.loginId}`}
    >
      <Squircle src={user.profileImageURLs?.[0]} wrapperClassName="w-8 flex-shrink-0 sm:w-10">
        {user.nickname.slice(0, 2)}
      </Squircle>
      <div className="ml-3 hidden w-full min-w-0 gap-1 py-0.5 xl:grid">
        <div className="hidden overflow-hidden whitespace-nowrap leading-5 xl:block">{user.nickname}</div>
        <div className="dark:text-midnight-400 text-midnight-300 hidden overflow-hidden text-ellipsis whitespace-nowrap leading-5 xl:block">
          @{user.loginId}
        </div>
      </div>
      <form action={formAction}>
        <label className="relative" onClick={(e) => e.stopPropagation()}>
          <input
            className="hover:bg-midnight-500/10 hover:dark:bg-midnight-500/40 peer absolute inset-0 appearance-none overflow-hidden rounded-full transition-colors"
            type="checkbox"
          />
          <div className="pointer-events-none absolute -top-6 right-0 z-10 hidden w-[271px] -translate-y-full rounded-2xl border bg-white p-4 opacity-0 shadow-lg transition-opacity peer-checked:pointer-events-auto peer-checked:opacity-100 xl:block dark:bg-gray-800">
            <button
              className="group flex w-fit items-center gap-5 rounded-full p-3 text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-red-600 active:scale-90 disabled:text-gray-500 disabled:hover:bg-inherit disabled:active:scale-100 xl:m-0 hover:dark:bg-red-500/20 focus:dark:outline-red-200 disabled:dark:text-gray-400"
              disabled={pending}
            >
              {pending ? (
                <Loading />
              ) : (
                <>
                  <IconLogout className="w-6 transition-transform group-hover:scale-110 group-disabled:scale-100" />
                  <span className="hidden min-w-0 xl:block">로그아웃</span>
                </>
              )}
            </button>
          </div>
          <IconMore className="relative hidden w-11 cursor-pointer p-3 xl:block" />
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
      <div className="mx-3 hidden w-full min-w-0 gap-1 py-0.5 xl:grid">
        <div className="h-5 animate-pulse rounded-xl bg-gray-200 xl:block dark:bg-gray-800" />
        <div className="h-5 animate-pulse rounded-xl bg-gray-200 xl:block dark:bg-gray-800" />
      </div>
    </div>
  )
}
