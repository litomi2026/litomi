import { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { desc, eq } from 'drizzle-orm'

import { decodeDeviceType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { credentialTable } from '@/database/supabase/passkey'

import PasskeyList from './PasskeyList'
import { getTruncatedId } from './utils'

type Props = {
  userId: number
}

export default async function PasskeySettings({ userId }: Props) {
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
    .where(eq(credentialTable.userId, userId))
    .orderBy(desc(credentialTable.createdAt))

  const passkeys = credentials.map((credential) => ({
    ...credential,
    credentialId: getTruncatedId(credential.credentialId),
    deviceType: decodeDeviceType(credential.deviceType),
    transports: credential.transports as AuthenticatorTransportFuture[],
  }))

  return <PasskeyList passkeys={passkeys} />
}
