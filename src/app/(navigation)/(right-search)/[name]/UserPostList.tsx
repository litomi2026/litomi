'use client'

import { PostFilter } from '@/app/api/post/types'
import PostCreationForm from '@/components/post/PostCreationForm'
import useMeQuery from '@/query/useMeQuery'

import PostList from '../posts/[filter]/PostList'
import NotFound from './not-found'

type Props = {
  username: string
}

export default function UserPostList({ username }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const isOwnProfile = me?.name === username

  return <PostList filter={PostFilter.USER} NotFound={<EmptyState isOwnProfile={isOwnProfile} />} username={username} />
}

function EmptyState({ isOwnProfile }: { isOwnProfile: boolean }) {
  if (!isOwnProfile) {
    return <NotFound />
  }

  return (
    <div className="flex flex-col grow">
      <PostCreationForm className="flex p-4 border-b-2" filter={PostFilter.USER} placeholder="첫 글을 작성해보세요!" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div aria-label="empty state icon" className="text-4xl mb-4" role="img">
          ✍️
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">아직 작성한 글이 없어요</h3>
        <p className="text-sm text-zinc-500 max-w-sm">생각을 공유하고 다른 사용자들과 소통해보세요</p>
      </div>
    </div>
  )
}
