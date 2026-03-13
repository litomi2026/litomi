import type { InfiniteData, QueryClient, QueryKey } from '@tanstack/react-query'

import type { GETV1PostResponse, Post } from '@/backend/api/v1/post/GET'

import { QueryKeys } from '@/constants/query'

export type PostLikeSnapshot = Array<[QueryKey, PostLikeState]>

type PostLikeState = Pick<Post, 'isLiked' | 'likeCount'>

export function restorePostLikeInPostLists(queryClient: QueryClient, postId: number, snapshot: PostLikeSnapshot) {
  for (const [queryKey, previousState] of snapshot) {
    queryClient.setQueryData<InfiniteData<GETV1PostResponse>>(queryKey, (data) =>
      patchPostList(data, postId, (post) => ({
        ...post,
        ...previousState,
      })),
    )
  }
}

export function setPostLikeInPostLists(queryClient: QueryClient, postId: number, liked: boolean) {
  patchPostLists(queryClient, postId, (post) => {
    const currentLiked = post.isLiked ?? false

    if (currentLiked === liked) {
      return post
    }

    return {
      ...post,
      isLiked: liked,
      likeCount: liked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1),
    }
  })
}

export function snapshotPostLikeInPostLists(queryClient: QueryClient, postId: number): PostLikeSnapshot {
  return queryClient
    .getQueriesData<InfiniteData<GETV1PostResponse>>({ queryKey: QueryKeys.postsBase })
    .flatMap(([queryKey, data]) => {
      const post = findPostInPostList(data, postId)

      if (!post) {
        return []
      }

      return [[queryKey, { isLiked: post.isLiked ?? false, likeCount: post.likeCount }]]
    })
}

export function togglePostLikeInPostLists(queryClient: QueryClient, postId: number) {
  patchPostLists(queryClient, postId, (post) => {
    const isLiked = post.isLiked ?? false
    const nextLiked = !isLiked

    return {
      ...post,
      isLiked: nextLiked,
      likeCount: nextLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1),
    }
  })
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
