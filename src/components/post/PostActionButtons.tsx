'use client'

import { ChartNoAxesColumn, Heart, MessageCircle, Repeat, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { toggleLikingPost } from '@/app/(navigation)/(right-search)/posts/action'
import useServerAction from '@/hook/useServerAction'
import { showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'

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
  const { data: me } = useMeQuery()

  const [_, dispatchAction, isPending] = useServerAction({
    action: toggleLikingPost,
    onSuccess: ({ liked }) => {
      if (liked) {
        toast.success('좋아요 했어요')
      } else {
        toast.info('좋아요 취소했어요')
      }
    },
  })

  function handleLike() {
    if (!me) {
      showLoginRequiredToast()
      return
    }

    dispatchAction(postId)
  }

  return (
    <div className="flex flex-wrap gap-2 text-zinc-400 [&_svg]:size-9 [&_svg]:shrink-0 [&_svg]:p-2 [&_svg]:rounded-full [&_svg]:transition-all">
      <div className="grid grow grid-cols-4 gap-1 text-sm">
        <div className="flex items-center">
          <MessageCircle />
          {commentCount}
        </div>
        <div className="flex items-center">
          <Repeat />
          {repostCount}
        </div>
        <button
          className="flex items-center group w-fit transition hover:text-red-500 disabled:opacity-50"
          disabled={isPending}
          onClick={handleLike}
        >
          <Heart
            aria-selected={isLiked}
            className="group-hover:bg-red-500/20 group-hover:text-red-500 aria-selected:text-red-500"
          />
          <span aria-selected={isLiked} className="transition aria-selected:font-medium aria-selected:text-red-500">
            {likeCount}
          </span>
        </button>
        <div className="flex items-center">
          <ChartNoAxesColumn />
          {viewCount}
        </div>
      </div>
      <div className="flex">
        <Share2 />
      </div>
    </div>
  )
}
