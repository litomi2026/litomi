import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query'

import type { GETV1PostResponse, Post } from '@/backend/api/v1/post/GET'
import type { GETV1PostLikedResponse } from '@/backend/api/v1/post/liked'

import { QueryKeys } from '@/constants/query'

export type LikedPostIdsSnapshot = GETV1PostLikedResponse | undefined
export type PostLikeSnapshot = Array<[QueryKey, PostLikeState]>
export type PostListSnapshot = Array<[QueryKey, InfiniteData<GETV1PostResponse> | undefined]>

type PostLikeState = Pick<Post, 'likeCount'>

export function applyPostLikeCountDeltaInPostLists(queryClient: QueryClient, postId: number, delta: number) {
  patchPostLists(queryClient, postId, (post) => {
    return {
      ...post,
      likeCount: Math.max(0, post.likeCount + delta),
    }
  })
}

export function removePostFromPostLists(queryClient: QueryClient, postId: number) {
  queryClient.setQueriesData<InfiniteData<GETV1PostResponse>>({ queryKey: QueryKeys.postsBase }, (data) =>
    removePostFromPostList(data, postId),
  )
}

export function restoreLikedPostIds(queryClient: QueryClient, snapshot: LikedPostIdsSnapshot) {
  queryClient.setQueryData<GETV1PostLikedResponse | undefined>(QueryKeys.likedPosts, snapshot)
}

export function restorePostLikeInPostLists(queryClient: QueryClient, postId: number, snapshot: PostLikeSnapshot) {
  for (const [queryKey, previousState] of snapshot) {
    queryClient.setQueryData<InfiniteData<GETV1PostResponse>>(queryKey, (data) =>
      patchPostList(data, postId, (post) => ({
        ...post,
        likeCount: previousState.likeCount,
      })),
    )
  }
}

export function restorePostLists(queryClient: QueryClient, snapshot: PostListSnapshot) {
  for (const [queryKey, previousData] of snapshot) {
    queryClient.setQueryData<InfiniteData<GETV1PostResponse> | undefined>(queryKey, previousData)
  }
}

export function setPostLikedInLikedPostIds(queryClient: QueryClient, postId: number, liked: boolean) {
  queryClient.setQueryData<GETV1PostLikedResponse | undefined>(QueryKeys.likedPosts, (previous) => {
    if (!previous) {
      return liked ? { postIds: [postId] } : previous
    }

    const hasPostId = previous.postIds.includes(postId)

    if (liked) {
      if (hasPostId) {
        return previous
      }

      return {
        postIds: [postId, ...previous.postIds],
      }
    }

    if (!hasPostId) {
      return previous
    }

    return {
      postIds: previous.postIds.filter((id) => id !== postId),
    }
  })
}

export function snapshotLikedPostIds(queryClient: QueryClient): LikedPostIdsSnapshot {
  return queryClient.getQueryData<GETV1PostLikedResponse>(QueryKeys.likedPosts)
}

export function snapshotPostLikeInPostLists(queryClient: QueryClient, postId: number): PostLikeSnapshot {
  return queryClient
    .getQueriesData<InfiniteData<GETV1PostResponse>>({ queryKey: QueryKeys.postsBase })
    .flatMap(([queryKey, data]) => {
      const post = findPostInPostList(data, postId)

      if (!post) {
        return []
      }

      return [[queryKey, { likeCount: post.likeCount }]]
    })
}

export function snapshotPostLists(queryClient: QueryClient): PostListSnapshot {
  return queryClient.getQueriesData<InfiniteData<GETV1PostResponse>>({ queryKey: QueryKeys.postsBase })
}

function findPostInPostList(data: InfiniteData<GETV1PostResponse> | undefined, postId: number) {
  return data?.pages.flatMap((page) => page.posts).find((post) => post.id === postId)
}

function patchPostList(
  data: InfiniteData<GETV1PostResponse> | undefined,
  postId: number,
  updater: (post: Post) => Post,
) {
  if (!data) {
    return data
  }

  let didChange = false

  const pages = data.pages.map((page) => {
    let pageDidChange = false

    const posts = page.posts.map((post) => {
      if (post.id !== postId) {
        return post
      }

      const nextPost = updater(post)

      if (nextPost !== post) {
        didChange = true
        pageDidChange = true
      }

      return nextPost
    })

    if (!pageDidChange) {
      return page
    }

    return { ...page, posts }
  })

  if (!didChange) {
    return data
  }

  return { ...data, pages }
}

function patchPostLists(queryClient: QueryClient, postId: number, updater: (post: Post) => Post) {
  queryClient.setQueriesData<InfiniteData<GETV1PostResponse>>({ queryKey: QueryKeys.postsBase }, (data) => {
    return patchPostList(data, postId, updater)
  })
}

function removePostFromPostList(data: InfiniteData<GETV1PostResponse> | undefined, postId: number) {
  if (!data) {
    return data
  }

  let didChange = false

  const pages = data.pages.map((page) => {
    const posts = page.posts.filter((post) => post.id !== postId)

    if (posts.length === page.posts.length) {
      return page
    }

    didChange = true
    return { ...page, posts }
  })

  if (!didChange) {
    return data
  }

  return { ...data, pages }
}
