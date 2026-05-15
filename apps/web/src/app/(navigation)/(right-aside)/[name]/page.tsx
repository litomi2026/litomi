import { defaultOpenGraph, SHORT_NAME } from '@litomi/domain/constants'
import { getUsernameFromParam } from '@litomi/std'
import { Metadata } from 'next'

import { getUserByName } from './common'
import UserPostList from './UserPostList'

export const metadata: Metadata = {
  title: '내 이야기',
  openGraph: {
    ...defaultOpenGraph,
    title: `내 이야기 - ${SHORT_NAME}`,
    url: '/@/settings',
  },
}

export default async function Page({ params }: PageProps<'/[name]'>) {
  const { name } = await params
  const username = getUsernameFromParam(name)

  if (!username) {
    return
  }

  const user = await getUserByName(username)

  if (!user) {
    return
  }

  return <UserPostList username={username} />
}
