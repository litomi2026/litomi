'use client'

import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChartNoAxesColumn, Heart, MessageCircle, Repeat, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import type { POSTV1PostIdLikeResponse } from '@/backend/api/v1/post/[id]/like/POST'

import { QueryKeys } from '@/constants/query'
import { showLoginRequiredToast } from '@/lib/toast'
import useLikedPostIdsQuery from '@/query/useLikedPostIdsQuery'
import useMeQuery from '@/query/useMeQuery'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { togglePostLike } from './api'
import {
  applyPostLikeCountDeltaInPostLists,
  type LikedPostIdsSnapshot,
  type PostLikeSnapshot,
  restoreLikedPostIds,
  restorePostLikeInPostLists,
  setPostLikedInLikedPostIds,
  snapshotLikedPostIds,
  snapshotPostLikeInPostLists,
} from './cache'

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
  const { data: likedPostIds } = useLikedPostIdsQuery()
  const queryClient = useQueryClient()
  const likeMutationKey = ['post', postId, 'like'] as const
  const isLikePending = useIsMutating({ mutationKey: likeMutationKey }) > 0
  const resolvedIsLiked = likedPostIds?.has(postId) ?? isLiked

  const { mutate } = useMutation<
    POSTV1PostIdLikeResponse,
    ProblemDetailsError,
    number,
    {
      likedPostIdsSnapshot: LikedPostIdsSnapshot
      nextLiked: boolean
      snapshot: PostLikeSnapshot
    }
  >({
    mutationKey: likeMutationKey,
    mutationFn: togglePostLike,
    onMutate: async (mutatingPostId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: QueryKeys.postsBase }),
        queryClient.cancelQueries({ queryKey: QueryKeys.likedPosts }),
      ])

      const snapshot = snapshotPostLikeInPostLists(queryClient, mutatingPostId)
      const likedPostIdsSnapshot = snapshotLikedPostIds(queryClient)
      const nextLiked = !resolvedIsLiked

      applyPostLikeCountDeltaInPostLists(queryClient, mutatingPostId, nextLiked ? 1 : -1)
      setPostLikedInLikedPostIds(queryClient, mutatingPostId, nextLiked)

      return { snapshot, likedPostIdsSnapshot, nextLiked }
    },
    onError: (_error, mutatingPostId, context) => {
      if (context?.snapshot) {
        restorePostLikeInPostLists(queryClient, mutatingPostId, context.snapshot)
      }

      restoreLikedPostIds(queryClient, context?.likedPostIdsSnapshot)
    },
    onSuccess: ({ liked }, mutatingPostId, context) => {
      setPostLikedInLikedPostIds(queryClient, mutatingPostId, liked)

      if (context && liked !== context.nextLiked) {
        applyPostLikeCountDeltaInPostLists(queryClient, mutatingPostId, liked ? 2 : -2)
      }

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

    mutate(postId)
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
          disabled={isLikePending}
          onClick={handleLike}
        >
          <Heart
            aria-selected={resolvedIsLiked}
            className="group-hover:bg-red-500/20 group-hover:text-red-500 aria-selected:text-red-500"
          />
          <span
            aria-selected={resolvedIsLiked}
            className="transition aria-selected:font-medium aria-selected:text-red-500"
          >
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
