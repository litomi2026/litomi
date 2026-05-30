'use client'

import { PostFilter } from '@litomi/domain/post/filter'
import { SquarePen } from 'lucide-react'

import PostCreationForm from '@/components/post/PostCreationForm'
import StatusState from '@/components/status/StatusState'
import useMeQuery from '@/query/useMeQuery'

import PostList from '../posts/[filter]/MasonryPostList'
import NotFound from './not-found'

type Props = {
  username: string
}

export default function UserPostList({ username }: Props) {
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
      <StatusState
        description="생각을 공유하고 다른 사용자들과 소통해보세요"
        icon={<SquarePen className="size-8" />}
        title="아직 작성한 글이 없어요"
      />
    </div>
  )
}
