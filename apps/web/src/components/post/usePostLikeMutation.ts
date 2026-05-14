'use client'

import { QueryKeys } from '@litomi/domain/constants/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ProblemDetailsError } from '@/utils/react-query-error'

import { showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'

import { toggleLikingPost } from './api'
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

type Context = {
  likedPostIdsSnapshot: LikedPostIdsSnapshot
  snapshot: PostLikeSnapshot
}

type Variables = {
  liked: boolean
}

export default function usePostLikeMutation(postId: number) {
  const { data: me } = useMeQuery()
  const queryClient = useQueryClient()

  const mutation = useMutation<unknown, ProblemDetailsError, Variables, Context>({
    mutationFn: ({ liked }) => toggleLikingPost(postId, liked),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.postsBase })
      await queryClient.cancelQueries({ queryKey: QueryKeys.likedPosts })

      const snapshot = snapshotPostLikeInPostLists(queryClient, postId)
      const likedPostIdsSnapshot = snapshotLikedPostIds(queryClient)

      applyPostLikeCountDeltaInPostLists(queryClient, postId, variables.liked ? 1 : -1)
      setPostLikedInLikedPostIds(queryClient, postId, variables.liked)

      return {
        snapshot,
        likedPostIdsSnapshot,
      }
    },
    onError: (_error, _variables, context) => {
      restorePostLikeInPostLists(queryClient, postId, context?.snapshot ?? [])
      restoreLikedPostIds(queryClient, context?.likedPostIdsSnapshot)
    },
  })

  async function setLiked(liked: boolean) {
    if (!me) {
      showLoginRequiredToast()
      return false
    }

    await mutation.mutateAsync({ liked })
    return true
  }

  return {
    isPending: mutation.isPending,
    setLiked,
  }
}
