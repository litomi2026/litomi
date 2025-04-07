'use client'

import useMeQuery from '@/query/useMeQuery'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import Link from 'next/link'

import IconMore from '../icons/IconMore'
import Squircle from '../ui/Squircle'
import LoginIconLink from './LoginIconLink'
import LogoutButton from './LogoutButton'

export default function Profile() {
  const { data: user } = useMeQuery()

  if (!user) {
    return <LoginIconLink />
  }

  const { loginId, imageURL, nickname } = user

  return (
    <Link
      className="relative flex items-center justify-center w-fit m-auto p-2 rounded-full transition hover:bg-zinc-800 active:bg-zinc-900
        sm:my-0 sm:pointer-events-none
        2xl:w-full 2xl:pl-3 2xl:py-2"
      href={`/@${loginId}`}
    >
      <Squircle
        className="w-8 flex-shrink-0 sm:w-10 fill-zinc-600"
        src={imageURL ?? 'https://i.imgur.com/i0A7nbA_d.webp?maxwidth=760&fidelity=grand'}
      >
        {nickname.slice(0, 2)}
      </Squircle>
      <div className="ml-3 hidden w-full min-w-0 gap-1 py-0.5 2xl:grid">
        <div className="overflow-hidden whitespace-nowrap leading-5">{nickname}</div>
        <div className="text-zinc-400 line-clamp-1 leading-5">@{loginId}</div>
      </div>
      <label
        className="absolute inset-0 cursor-pointer rounded-full select-none pointer-events-none sm:pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <input className="peer" hidden type="checkbox" />
        <div
          className="absolute -top-4 left-0 2xl:right-0 z-10 -translate-y-full pointer-events-none opacity-0 rounded-2xl border-2 border-zinc-700 p-4 transition 
            peer-checked:pointer-events-auto peer-checked:opacity-100 bg-zinc-900"
        >
          <LogoutButton />
        </div>
      </label>
      <IconMore className="shrink-0 pointer-events-none hidden w-11 p-3 2xl:block" />
    </Link>
  )
}

export function ProfileError({ reset }: ErrorBoundaryFallbackProps) {
  return (
    <button className="flex items-center p-2 rounded-full sm:my-0 2xl:pl-3 2xl:py-2" onClick={reset}>
      <Squircle className="w-8 flex-shrink-0 sm:w-10 fill-red-700" textClassName="fill-foreground">
        오류
      </Squircle>
      <p className="ml-3 hidden py-0.5 text-red-600 2xl:block">오류가 발생했어요</p>
    </button>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center justify-center w-fit m-auto p-2 rounded-full sm:my-0 2xl:w-full 2xl:pl-3 2xl:py-2">
      <Squircle className="w-8 animate-fade-in flex-shrink-0 sm:w-10 fill-zinc-700" />
      <div className="ml-3 hidden w-full min-w-0 gap-1 py-0.5 2xl:grid">
        <div className="h-5 animate-fade-in rounded-full bg-zinc-700" />
        <div className="h-5 animate-fade-in rounded-full bg-zinc-700" />
      </div>
    </div>
  )
}
