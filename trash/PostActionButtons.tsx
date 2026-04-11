'use client'

import { ChartNoAxesColumn, Heart, MessageCircle, Repeat, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import useLikedPostIdsQuery from '@/query/useLikedPostIdsQuery'

import usePostLikeMutation from '../src/components/post/usePostLikeMutation'

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
  const { data: likedPostIds } = useLikedPostIdsQuery()
  const [localLikeState, setLocalLikeState] = useState({
    likeCount,
    liked: isLiked,
  })
  const likedFromQuery = likedPostIds?.has(postId)
  const { isPending: isLikePending, setLiked } = usePostLikeMutation(postId)

  useEffect(() => {
    if (isLikePending) {
      return
    }

    setLocalLikeState((current) => {
      const nextState = {
        liked: likedFromQuery ?? isLiked,
        likeCount,
      }

      if (current.liked === nextState.liked && current.likeCount === nextState.likeCount) {
        return current
      }

      return nextState
    })
  }, [isLiked, isLikePending, likeCount, likedFromQuery])

  function handleLike() {
    const nextLiked = !localLikeState.liked

    if (!setLiked(nextLiked)) {
      return
    }

    setLocalLikeState((current) => ({
      liked: nextLiked,
      likeCount: Math.max(0, current.likeCount + (nextLiked ? 1 : -1)),
    }))
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
          aria-label="좋아요"
          className="flex items-center group w-fit transition hover:text-red-500 disabled:opacity-50"
          disabled={isLikePending}
          onClick={handleLike}
          type="button"
        >
          <Heart
            aria-selected={localLikeState.liked}
            className="group-hover:bg-red-500/20 group-hover:text-red-500 aria-selected:text-red-500"
          />
          <span
            aria-selected={localLikeState.liked}
            className="transition aria-selected:font-medium aria-selected:text-red-500"
          >
            {localLikeState.likeCount}
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
