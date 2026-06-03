'use client'

import useMeQuery from '@/query/useMeQuery'

import PostList from '../posts/[filter]/PostList'

type Props = {
  username: string
}

export default function UserPostList({ username }: Props) {
  const { data: me } = useMeQuery()
  const viewer = me === undefined ? 'pending' : me?.name === username ? 'self' : 'other'

  return <PostList source={{ type: 'userPosts', username, viewer }} />
}
