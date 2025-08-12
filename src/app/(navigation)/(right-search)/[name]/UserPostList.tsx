'use client'

import Link from 'next/link'

import { PostFilter } from '@/app/api/post/schema'
import PostCreationForm from '@/components/post/PostCreationForm'
import useMeQuery from '@/query/useMeQuery'

import PostList from '../posts/[filter]/PostList'

type Props = {
  username: string
}

export default function UserPostList({ username }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const isOwnProfile = me?.name === username

  return (
    <PostList
      filter={PostFilter.USER}
      NotFound={<EmptyState isOwnProfile={isOwnProfile} username={username} />}
      username={username}
    />
  )
}

function EmptyState({ isOwnProfile, username }: { isOwnProfile: boolean; username: string }) {
  if (isOwnProfile) {
    return (
      <div className="flex flex-col grow">
        <div className="border-b-2 border-zinc-800 p-4">
          <PostCreationForm filter={PostFilter.USER} placeholder="첫 글을 작성해보세요!" />
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div aria-label="empty state icon" className="text-4xl mb-4" role="img">
            ✍️
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">아직 작성한 글이 없어요</h3>
          <p className="text-sm text-zinc-500 max-w-sm">생각을 공유하고 다른 사용자들과 소통해보세요</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center grow">
      <div aria-label="empty state icon" className="text-4xl mb-4" role="img">
        📝
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">@{username}님의 글이 없어요</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-sm">아직 글을 작성하지 않았어요</p>
      <Link className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors" href="/posts/recommand">
        다른 글 둘러보기
      </Link>
    </div>
  )
}
