'use client'

import type {
  DELETEV1UserIdFollowResponse,
  GETV1MeFollowingResponse,
  PUTV1UserIdFollowResponse,
} from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'

import type { ProblemDetailsError } from '@/utils/react-query-error'

import {
  type PostListSnapshot,
  removeAuthorPostsFromFollowingPostLists,
  restorePostLists,
  snapshotFollowingPostLists,
} from '@/components/post/cache'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { showLoginRequiredToast } from '@/lib/toast'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Context = {
  followingPostListsSnapshot: PostListSnapshot
  followingUserIdsSnapshot: FollowingUserIdsSnapshot
  previousFollowing: boolean
}

type FollowingUserIdsSnapshot = GETV1MeFollowingResponse | undefined

type Options = {
  initialFollowing?: boolean
  onError?: (following: boolean) => void
  onOptimisticUpdate?: (following: boolean) => void
  onSuccess?: (following: boolean) => void
}

type SetUserFollowResponse = DELETEV1UserIdFollowResponse | PUTV1UserIdFollowResponse

type Variables = {
  following: boolean
}

export async function toggleUserFollowing(targetUserId: number, following: boolean) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/user/${targetUserId}/follow`

  const { data } = await fetchWithErrorHandling<SetUserFollowResponse>(url, {
    method: following ? 'PUT' : 'DELETE',
    credentials: 'include',
  })

  return data
}

export default function useUserFollowMutation(
  targetUserId: number,
  { initialFollowing, onError, onOptimisticUpdate, onSuccess }: Options = {},
) {
  const { data: me } = useMeQuery()
  const queryClient = useQueryClient()

  const mutation = useMutation<SetUserFollowResponse, ProblemDetailsError, Variables, Context>({
    mutationFn: ({ following }) => toggleUserFollowing(targetUserId, following),

    onMutate: async ({ following }) => {
      await queryClient.cancelQueries({ queryKey: QueryKeys.followingUsers, exact: true })
      await queryClient.cancelQueries({ queryKey: QueryKeys.followingPosts })

      const followingUserIdsSnapshot = queryClient.getQueryData<GETV1MeFollowingResponse>(QueryKeys.followingUsers)
      const followingPostListsSnapshot = snapshotFollowingPostLists(queryClient)
      const previousFollowing = initialFollowing ?? followingUserIdsSnapshot?.userIds.includes(targetUserId) ?? false

      setUserFollowingInFollowingIds(queryClient, targetUserId, following)

      if (!following) {
        removeAuthorPostsFromFollowingPostLists(queryClient, targetUserId)
      }

      onOptimisticUpdate?.(following)

      return {
        followingPostListsSnapshot,
        followingUserIdsSnapshot,
        previousFollowing,
      }
    },

    onError: (_error, variables, context) => {
      queryClient.setQueryData<GETV1MeFollowingResponse | undefined>(
        QueryKeys.followingUsers,
        context?.followingUserIdsSnapshot,
      )

      restorePostLists(queryClient, context?.followingPostListsSnapshot ?? [])
      onError?.(context?.previousFollowing ?? !variables.following)
    },

    onSuccess: (_data, variables) => {
      onSuccess?.(variables.following)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.followingPosts })
    },

    meta: {
      suppressGlobalErrorToastForStatuses: [400, 401, 404],
    },
  })

  async function setFollowing(following: boolean) {
    if (!me) {
      showLoginRequiredToast()
      return false
    }

    await mutation.mutateAsync({ following })
    return true
  }

  return {
    isPending: mutation.isPending,
    setFollowing,
  }
}

function setUserFollowingInFollowingIds(queryClient: QueryClient, userId: number, following: boolean) {
  queryClient.setQueryData<GETV1MeFollowingResponse | undefined>(QueryKeys.followingUsers, (previous) => {
    if (!previous) {
      return following ? { userIds: [userId] } : previous
    }

    const hasUserId = previous.userIds.includes(userId)

    if (following) {
      if (hasUserId) {
        return previous
      }

      return { userIds: [userId, ...previous.userIds] }
    }

    if (!hasUserId) {
      return previous
    }

    return { userIds: previous.userIds.filter((followingUserId) => followingUserId !== userId) }
  })
}
