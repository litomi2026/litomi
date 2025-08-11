'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { toggleLikingPost } from '@/app/(navigation)/(right-search)/posts/action'
import useMeQuery from '@/query/useMeQuery'

import IconChart from '../icons/IconChart'
import IconChat from '../icons/IconChat'
import IconHeart from '../icons/IconHeart'
import IconLogout from '../icons/IconLogout'
import IconRepeat from '../icons/IconRepeat'
import LoginLink from '../LoginLink'

type Props = {
  postId: number
  likeCount?: number
  commentCount?: number
  repostCount?: number
  viewCount?: number
  isLiked?: boolean
}

export default function PostActionButtons({
  postId,
  likeCount = 0,
  commentCount = 0,
  repostCount = 0,
  viewCount = 0,
  isLiked = false,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const { data: me } = useMeQuery()

  const handleLike = () => {
    if (!me) {
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요.</div>
          <LoginLink>로그인하기</LoginLink>
        </div>,
      )
      return
    }

    startTransition(async () => {
      const result = await toggleLikingPost(postId)
      if ('error' in result) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2 text-zinc-400">
      <div className="grid grow grid-cols-4 gap-1 text-sm">
        <div className="flex items-center">
          <IconChat className="w-9 shrink-0 p-2" />
          {commentCount}
        </div>
        <div className="flex items-center">
          <IconRepeat className="w-9 shrink-0 p-2" />
          {repostCount}
        </div>
        <button
          className="flex items-center group transition-all duration-150 hover:text-red-500 disabled:opacity-50"
          disabled={isPending}
          onClick={handleLike}
        >
          <IconHeart
            aria-selected={isLiked}
            className="w-9 shrink-0 p-2 transition-all duration-150 group-hover:bg-red-500/20 group-hover:text-red-500 aria-selected:text-red-500"
          />
          <span className={`transition-all duration-150 ${isLiked ? 'font-medium' : ''}`}>{likeCount}</span>
        </button>
        <div className="flex items-center">
          <IconChart className="w-9 shrink-0 p-2" />
          {viewCount}
        </div>
      </div>
      <div className="flex">
        <IconLogout className="w-9 -rotate-90 p-2" />
      </div>
    </div>
  )
}
