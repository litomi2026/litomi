'use client'

import { Heart } from 'lucide-react'
import { useState } from 'react'

import usePostLikeMutation from '@/components/post/usePostLikeMutation'
import useLikedPostIdsQuery from '@/query/useLikedPostIdsQuery'
import useMeQuery from '@/query/useMeQuery'

type OptimisticLikeState = {
  likeCount: number
  liked: boolean
}

type Props = {
  likeCount: number
  postId: number
}

export default function PostDetailLikeButton({ likeCount, postId }: Props) {
  const { data: me, isLoading: isMeLoading } = useMeQuery()
  const { data: likedPostIds } = useLikedPostIdsQuery()
  const { isPending: isLikePending, setLiked } = usePostLikeMutation(postId)

  const [optimisticLikeState, setOptimisticLikeState] = useState<OptimisticLikeState>()

  const likedFromQuery = likedPostIds?.has(postId)
  const isLikeStateLoading = isMeLoading || (Boolean(me) && likedPostIds === undefined)
  const resolvedIsLiked = optimisticLikeState?.liked ?? likedFromQuery ?? false
  const resolvedLikeCount = optimisticLikeState?.likeCount ?? likeCount

  async function handleClick() {
    if (isLikeStateLoading) {
      return
    }

    if (!me) {
      await setLiked(!resolvedIsLiked)
      return
    }

    const previousState = optimisticLikeState
    const nextLiked = !resolvedIsLiked

    setOptimisticLikeState({
      liked: nextLiked,
      likeCount: Math.max(0, resolvedLikeCount + (nextLiked ? 1 : -1)),
    })

    try {
      await setLiked(nextLiked)
    } catch {
      setOptimisticLikeState(previousState)
    }
  }

  return (
    <button
      aria-label="좋아요"
      aria-pressed={resolvedIsLiked}
      className="group flex items-center w-fit transition hover:text-red-600 disabled:opacity-50"
      disabled={isLikePending || isLikeStateLoading}
      onClick={() => void handleClick()}
      type="button"
    >
      <div className="shrink-0 rounded-full transition group-hover:bg-red-600/20 group-hover:text-red-600 aria-pressed:text-red-600">
        <Heart aria-selected={resolvedIsLiked} className="size-9 sm:size-10 p-2 aria-selected:text-red-600" />
      </div>
      <span
        aria-selected={resolvedIsLiked}
        className="tabular-nums aria-selected:font-medium aria-selected:text-red-600"
      >
        {resolvedLikeCount}
      </span>
    </button>
  )
}
