import { PageProps } from '@/types/nextjs'
import { getUsernameFromParam } from '@/utils/param'

import UserPostList from './UserPostList'

export const dynamic = 'error'

type Params = {
  name: string
}

export default async function Page({ params }: PageProps<Params>) {
  const { name } = await params
  const username = getUsernameFromParam(name)

  return <UserPostList username={username} />
}
