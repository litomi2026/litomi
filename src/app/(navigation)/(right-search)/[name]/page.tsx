import { Metadata } from 'next'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { getUsernameFromParam } from '@/utils/param'

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
