import { cookies } from 'next/headers'

import { getUserIdFromAccessToken } from '@/utils/cookie'

import Censorships from './Censorships'
import GuestView from './GuestView'

export default async function CensorPage() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return <GuestView />
  }

  return <Censorships />
}
