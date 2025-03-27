'use client'

import type { BaseParams } from '@/types/nextjs'

import { THEME_COLOR } from '@/common/constants'
import { LocalStorage } from '@/common/storage'
import Squircle from '@/components/Squircle'
import { getUserId, useAuthStore } from '@/model/auth'
import useLogoutMutation from '@/query/useLogoutMutation'
import useUserQuery from '@/query/useUserQuery'
import LogoutIcon from '@/svg/LogoutIcon'
import MoreIcon from '@/svg/MoreIcon'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { type MouseEvent } from 'react'
import toast from 'react-hot-toast'

import LoginLink from './LoginLink'

export default function ProfileLink() {
  const { locale } = useParams<BaseParams>()

  const { accessToken, setAccessToken } = useAuthStore()
  const userId = getUserId(accessToken)
  const { data: user, isLoading: isUserLoading } = useUserQuery({ id: userId })
  const userNickname = user?.nickname ?? ''
  const userName = user?.name ?? ''

  const { mutateAsync: logout, isPending } = useLogoutMutation()

  async function handleLogoutClick(e: MouseEvent) {
    e.preventDefault()

    await toast.promise(logout(), {
      loading: '로그아웃 중이에요',
      success: '로그아웃했어요',
      error: '로그아웃에 실패했어요',
    })

    setAccessToken('')
    localStorage.removeItem(LocalStorage.REFRESH_TOKEN)
  }

  if (accessToken === null || isUserLoading) {
    return (
      <div className="flex items-center justify-center sm:py-4">
        <Squircle fill={THEME_COLOR} wrapperClassName="w-8 animate-pulse flex-shrink-0 sm:w-10" />
        <div className="mx-3 hidden w-full min-w-0 gap-1 py-0.5 xl:grid">
          <div className="h-5 animate-pulse rounded-xl bg-gray-200 xl:block dark:bg-gray-800" />
          <div className="h-5 animate-pulse rounded-xl bg-gray-200 xl:block dark:bg-gray-800" />
        </div>
      </div>
    )
  }

  return user ? (
    <Link
      className="relative flex items-center justify-center rounded-full sm:px-2 sm:py-4 xl:px-0"
      href={`/${locale}/@${userName}`}
    >
      <Squircle
        className="text-white"
        fill={THEME_COLOR}
        src={user.profileImageURLs?.[0]}
        wrapperClassName="w-8 flex-shrink-0 sm:w-10"
      >
        {userNickname.slice(0, 2)}
      </Squircle>
      <div className="ml-3 hidden w-full min-w-0 gap-1 py-0.5 xl:grid">
        <div className="hidden overflow-hidden whitespace-nowrap leading-5 xl:block">
          {userNickname}
        </div>
        <div className="dark:text-midnight-400 text-midnight-300 hidden overflow-hidden text-ellipsis whitespace-nowrap leading-5 xl:block">
          @{userName}
        </div>
      </div>
      <label className="relative" onClick={(e) => e.stopPropagation()}>
        <input
          className="hover:bg-midnight-500/10 hover:dark:bg-midnight-500/40 peer absolute inset-0 appearance-none overflow-hidden rounded-full transition-colors"
          type="checkbox"
        />
        <div className="pointer-events-none absolute -top-6 right-0 z-10 hidden w-[271px] -translate-y-full rounded-2xl border bg-white p-4 opacity-0 shadow-lg transition-opacity peer-checked:pointer-events-auto peer-checked:opacity-100 xl:block dark:bg-gray-800">
          <button
            className="group flex w-fit items-center gap-5 rounded-full p-3 text-red-500 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-red-600 active:scale-90 disabled:text-gray-500 disabled:hover:bg-inherit disabled:active:scale-100 xl:m-0 hover:dark:bg-red-500/20 focus:dark:outline-red-200 disabled:dark:text-gray-400"
            disabled={isPending}
            onClick={handleLogoutClick}
          >
            {isPending ? (
              <div className="flex translate-y-0.5 gap-2 p-2 dark:invert">
                <span className="sr-only">Loading...</span>
                <div className="h-2 w-2 animate-bounce rounded-full bg-black [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-black [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-black"></div>
              </div>
            ) : (
              <>
                <LogoutIcon className="w-6 transition-transform group-hover:scale-110 group-disabled:scale-100" />
                <span className="hidden min-w-0 xl:block">로그아웃</span>
              </>
            )}
          </button>
        </div>
        <MoreIcon className="relative hidden w-11 cursor-pointer p-3 xl:block" />
      </label>
    </Link>
  ) : (
    <LoginLink />
  )
}
