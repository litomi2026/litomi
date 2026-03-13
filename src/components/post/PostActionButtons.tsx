'use client'

import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChartNoAxesColumn, Heart, MessageCircle, Repeat, Share2 } from 'lucide-react'
import { toast } from 'sonner'

import type { POSTV1PostIdLikeResponse } from '@/backend/api/v1/post/[id]/like/POST'

import { QueryKeys } from '@/constants/query'
import { showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { togglePostLike } from './api'
import {
  type PostLikeSnapshot,
  restorePostLikeInPostLists,
  setPostLikeInPostLists,
  snapshotPostLikeInPostLists,
  togglePostLikeInPostLists,
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
  const queryClient = useQueryClient()
  const likeMutationKey = ['post', postId, 'like'] as const
  const isLikePending = useIsMutating({ mutationKey: likeMutationKey }) > 0

  const { mutate } = useMutation<
    POSTV1PostIdLikeResponse,
    ProblemDetailsError,
    number,
    { snapshot: PostLikeSnapshot }
  >({
    mutationKey: likeMutationKey,
    mutationFn: togglePostLike,
    onMutate: async (mutatingPostId) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.postsBase })
      const snapshot = snapshotPostLikeInPostLists(queryClient, mutatingPostId)

      togglePostLikeInPostLists(queryClient, mutatingPostId)

      return { snapshot }
    },
    onError: (_error, mutatingPostId, context) => {
      if (context?.snapshot) {
        restorePostLikeInPostLists(queryClient, mutatingPostId, context.snapshot)
      }
    },
    onSuccess: ({ liked }, mutatingPostId) => {
      setPostLikeInPostLists(queryClient, mutatingPostId, liked)

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
