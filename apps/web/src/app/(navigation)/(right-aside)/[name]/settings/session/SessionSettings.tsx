import { hashSessionToken } from '@litomi/auth/session'
import { CookieKey } from '@litomi/domain/constants/storage'
import { cookies } from 'next/headers'

import { readCurrentSessionFamilyIdByTokenHash, readPersistentSessionFamiliesByUserId } from './query'
import SessionList from './SessionList'

type Props = {
  userId: number
}

export default async function SessionSettings({ userId }: Props) {
  const now = new Date()
  const [cookieStore, sessions] = await Promise.all([cookies(), readPersistentSessionFamiliesByUserId(userId, now)])
  const refreshToken = cookieStore.get(CookieKey.REFRESH_TOKEN)?.value

  const currentFamilyId = refreshToken
    ? await readCurrentSessionFamilyIdByTokenHash(userId, hashSessionToken(refreshToken))
    : null

  const currentSessions = sessions.map((session) => ({
    ...session,
    isCurrent: currentFamilyId === session.id,
  }))

  return <SessionList hasCurrentPersistentSession={Boolean(currentFamilyId)} sessions={currentSessions} />
}
