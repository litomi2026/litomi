import { getUserIdFromCookie } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getMe } from '../common'
import DonationsClient from './DonationsClient'
import Forbidden from './Forbidden'
import Unauthorized from './Unauthorized'

export default async function Page({ params }: PageProps<'/[name]/donations'>) {
  const userId = await getUserIdFromCookie()
  if (!userId) {
    return <Unauthorized />
  }

  const { name } = await params
  const usernameFromParam = getUsernameFromParam(name)
  const me = await getMe(userId)

  if (me.name !== usernameFromParam) {
    return <Forbidden loginUsername={me.name} />
  }

  return <DonationsClient />
}

