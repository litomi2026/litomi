'use client'

import { MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

import Squircle from '@/components/ui/Squircle'
import TooltipPopover from '@/components/ui/TooltipPopover'
import useMeQuery from '@/query/useMeQuery'

import LoginIconLink from './LoginIconLink'
import LogoutButton from './LogoutButton'

export default function Profile() {
  const { data: user, isLoading } = useMeQuery()

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return <LoginIconLink />
  }

  const { name, imageURL, nickname } = user

  return (
    <TooltipPopover
      buttonClassName="w-full pointer-events-none rounded-full transition sm:hover:bg-zinc-800 sm:active:bg-zinc-900 sm:pointer-events-auto"
      className="flex justify-center"
      position="top-right"
      type="popover"
    >
      <Link
        className="flex justify-center items-center gap-3 p-2 group rounded-full pointer-events-auto sm:pointer-events-none 2xl:pl-3"
        href={`/@${name}`}
        onClick={(e) => e.stopPropagation()}
        prefetch={false}
      >
        <Squircle className="w-8 shrink-0 sm:w-10 fill-zinc-600" src={imageURL}>
          {nickname.slice(0, 2)}
        </Squircle>
        <div className="hidden text-left grow min-w-0 gap-1 py-0.5 2xl:grid">
          <div className="leading-5 break-all line-clamp-1">{nickname}</div>
          <div className="overflow-hidden text-zinc-400 leading-5">@{name}</div>
        </div>
        <MoreHorizontal className="shrink-0 hidden size-11 p-3 2xl:block" />
      </Link>
      <div className="p-4 -ml-2 min-w-40 mb-2 rounded-2xl border-2 border-zinc-700 transition bg-zinc-900">
        <LogoutButton />
      </div>
    </TooltipPopover>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center justify-center w-fit m-auto p-2 rounded-full sm:my-0 2xl:w-full 2xl:pl-3 2xl:py-2">
      <Squircle className="w-8 animate-fade-in shrink-0 sm:w-10 fill-zinc-700" />
      <div className="ml-3 hidden w-full min-w-0 gap-1 py-0.5 2xl:grid">
        <div className="h-5 animate-fade-in rounded-full bg-zinc-700" />
        <div className="h-5 animate-fade-in rounded-full bg-zinc-700" />
      </div>
    </div>
  )
}
