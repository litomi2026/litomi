'use client'

import { PostFilter } from '@litomi/domain/post/filter'
import { SquarePen } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Profile.posts')

  if (!isCurrentUser) {
    return <NotFound />
  }

  return (
    <div className="flex flex-col grow">
      <PostCreationForm className="flex p-4 border-b" placeholder={t('createPlaceholder')} />
      <StatusState
        description={t('emptyDescription')}
        icon={<SquarePen className="size-8" />}
        title={t('emptyTitle')}
      />
    </div>
  )
}
