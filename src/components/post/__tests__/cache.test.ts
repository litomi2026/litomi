import { type InfiniteData, QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, test } from 'bun:test'

import type { GETV1PostResponse } from '@/backend/api/v1/post/GET'
import type { GETV1PostLikedResponse } from '@/backend/api/v1/post/liked'

import { PostFilter } from '@/backend/api/v1/post/constant'
import { QueryKeys } from '@/constants/query'
import { PostType } from '@/database/enum'

import {
  applyPostLikeCountDeltaInPostLists,
  removePostFromPostLists,
  restoreLikedPostIds,
  restorePostLikeInPostLists,
  restorePostLists,
  setPostLikedInLikedPostIds,
  snapshotLikedPostIds,
  snapshotPostLikeInPostLists,
  snapshotPostLists,
} from '../cache'

function createInfiniteData(postIds: number[]): InfiniteData<GETV1PostResponse> {
  return {
    pageParams: [undefined],
    pages: [
      {
        nextCursor: null,
        posts: postIds.map((id) => ({
          id,
          createdAt: new Date('2025-01-01T00:00:00.000Z'),
          content: `post-${id}`,
          type: PostType.TEXT,
          author: { id: 1, imageURL: null, name: 'user1', nickname: 'User One' },
          mangaId: null,
          likeCount: 0,
          commentCount: 0,
          repostCount: 0,
          referredPost: null,
        })),
      },
    ],
  }
}

describe('post cache helpers', () => {
  const queryClient = new QueryClient()

  afterEach(() => {
    queryClient.clear()
  })

  test('목록에서 글을 optimistic 하게 제거하고 snapshot으로 복구한다', () => {
    queryClient.setQueryData(QueryKeys.posts(PostFilter.RECOMMEND), createInfiniteData([1, 2]))
    queryClient.setQueryData(QueryKeys.posts(PostFilter.USER, undefined, 'user1'), createInfiniteData([1, 3]))

    const snapshot = snapshotPostLists(queryClient)

    removePostFromPostLists(queryClient, 1)

    expect(
      queryClient
        .getQueryData<InfiniteData<GETV1PostResponse>>(QueryKeys.posts(PostFilter.RECOMMEND))
        ?.pages[0]?.posts.map((post) => post.id),
    ).toEqual([2])
    expect(
      queryClient
        .getQueryData<InfiniteData<GETV1PostResponse>>(QueryKeys.posts(PostFilter.USER, undefined, 'user1'))
        ?.pages[0]?.posts.map((post) => post.id),
    ).toEqual([3])

    restorePostLists(queryClient, snapshot)

    expect(
      queryClient
        .getQueryData<InfiniteData<GETV1PostResponse>>(QueryKeys.posts(PostFilter.RECOMMEND))
        ?.pages[0]?.posts.map((post) => post.id),
    ).toEqual([1, 2])
  })

  test('좋아요 count를 optimistic 하게 변경하고 snapshot으로 복구한다', () => {
    queryClient.setQueryData(QueryKeys.posts(PostFilter.RECOMMEND), createInfiniteData([1]))

    const snapshot = snapshotPostLikeInPostLists(queryClient, 1)

    applyPostLikeCountDeltaInPostLists(queryClient, 1, 1)

    expect(
      queryClient.getQueryData<InfiniteData<GETV1PostResponse>>(QueryKeys.posts(PostFilter.RECOMMEND))?.pages[0]?.posts[0]
        ?.likeCount,
    ).toBe(1)

    restorePostLikeInPostLists(queryClient, 1, snapshot)

    expect(
      queryClient.getQueryData<InfiniteData<GETV1PostResponse>>(QueryKeys.posts(PostFilter.RECOMMEND))?.pages[0]?.posts[0]
        ?.likeCount,
    ).toBe(0)
  })

  test('좋아요한 글 ID 목록을 optimistic 하게 변경하고 snapshot으로 복구한다', () => {
    queryClient.setQueryData<GETV1PostLikedResponse>(QueryKeys.likedPosts, { postIds: [1, 3] })

    const snapshot = snapshotLikedPostIds(queryClient)

    setPostLikedInLikedPostIds(queryClient, 2, true)
    setPostLikedInLikedPostIds(queryClient, 1, false)

    expect(queryClient.getQueryData<GETV1PostLikedResponse>(QueryKeys.likedPosts)).toEqual({ postIds: [2, 3] })

    restoreLikedPostIds(queryClient, snapshot)

    expect(queryClient.getQueryData<GETV1PostLikedResponse>(QueryKeys.likedPosts)).toEqual({ postIds: [1, 3] })
  })
})
