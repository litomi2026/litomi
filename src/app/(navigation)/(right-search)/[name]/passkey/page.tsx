import { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { db } from '@/database/drizzle'
import { decodeDeviceType } from '@/database/enum'
import { credentialTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import GuestView from './GuestView'
import PasskeyList from './PasskeyList'

export default async function PasskeyPage() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return <GuestView />
  }

  const credentials = await db
    .select({
      id: credentialTable.id,
      createdAt: credentialTable.createdAt,
      deviceType: credentialTable.deviceType,
      transports: credentialTable.transports,
    })
    .from(credentialTable)
    .where(sql`${credentialTable.userId} = ${userId}`)
    .orderBy(sql`${credentialTable.createdAt} DESC`)

  const passkeys = credentials.map((c) => ({
    id: c.id,
    createdAt: c.createdAt,
    deviceType: decodeDeviceType(c.deviceType),
    transports: c.transports as AuthenticatorTransportFuture[],
  }))

  return <PasskeyList passkeys={passkeys} />
}
