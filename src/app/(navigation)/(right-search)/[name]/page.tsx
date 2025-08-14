import { cookies } from 'next/headers'

import { PageProps } from '@/types/nextjs'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getUserByName } from './common'
import UserPostList from './UserPostList'

type Params = {
  name: string
}

export default async function Page({ params }: PageProps<Params>) {
  const { name } = await params
  const usernameFromParam = getUsernameFromParam(name)
  const user = await getUserByName(usernameFromParam)

  // NOTE: 존재하지 않는 사용자
  if (!user) {
    return
  }

  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  // NOTE: 로그인하지 않았거나 name이 없는 경우
  if (!userId || !usernameFromParam) {
    return // <GuestView />
  }

  return <UserPostList username={usernameFromParam} />
}
