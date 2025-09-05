import { getUsernameFromParam } from '@/utils/param'

import { getUserByName } from './common'
import UserPostList from './UserPostList'

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
