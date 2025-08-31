import { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { decodeDeviceType } from '@/database/enum'
import { credentialTable } from '@/database/schema'

import PasskeyList from './PasskeyList'

type Props = {
  userId: string
  username: string
}

export default async function PasskeySettings({ userId, username }: Props) {
  const credentials = await db
    .select({
      id: credentialTable.id,
      credentialId: credentialTable.credentialId,
      createdAt: credentialTable.createdAt,
      lastUsedAt: credentialTable.lastUsedAt,
      deviceType: credentialTable.deviceType,
      transports: credentialTable.transports,
    })
    .from(credentialTable)
    .where(sql`${credentialTable.userId} = ${userId}`)
    .orderBy(sql`${credentialTable.createdAt} DESC`)

  const passkeys = credentials.map((credential) => ({
    ...credential,
    deviceType: decodeDeviceType(credential.deviceType),
    transports: credential.transports as AuthenticatorTransportFuture[],
  }))

  return <PasskeyList passkeys={passkeys} username={username} />
}

