'use client'

import { PostFilter } from '@litomi/contracts'
import { SquarePen } from 'lucide-react'

import PostCreationForm from '@/components/post/PostCreationForm'
import useMeQuery from '@/query/useMeQuery'

import PostList from '../posts/[filter]/MasonryPostList'
import NotFound from './not-found'

type Props = {
  username: string
}

export default function UserPostList({ username }: Readonly<Props>) {
  const { data: me } = useMeQuery()
  const isCurrentUser = me?.name === username

  return (
    <PostList
      filter={PostFilter.USER}
      NotFound={<EmptyState isCurrentUser={isCurrentUser} />}
      showMangaCover
      username={username}
    />
  )
}

function EmptyState({ isCurrentUser }: { isCurrentUser: boolean }) {
  if (!isCurrentUser) {
    return <NotFound />
  }

  return (
    <div className="flex flex-col grow">
      <PostCreationForm className="flex p-4 border-b" placeholder="첫 글을 작성해보세요!" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div aria-label="empty state icon" className="mb-4" role="img">
          <SquarePen aria-hidden className="size-10 text-zinc-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">아직 작성한 글이 없어요</h3>
        <p className="text-sm text-zinc-500 max-w-sm">생각을 공유하고 다른 사용자들과 소통해보세요</p>
      </div>
    </div>
  )
}
