import { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { desc, eq } from 'drizzle-orm'

import { decodeDeviceType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { credentialTable } from '@/database/supabase/passkey'

import PasskeyList from './PasskeyList'

type Props = {
  displayName: string
  loginId: string
  userId: number
}

export default async function PasskeySettings({ displayName, loginId, userId }: Props) {
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
    deviceType: decodeDeviceType(credential.deviceType),
    transports: credential.transports as AuthenticatorTransportFuture[],
  }))

  return (
    <PasskeyList
      passkeys={passkeys}
      passkeySignalData={{
        credentialIds: credentials.map((credential) => credential.credentialId).sort(),
        displayName,
        name: loginId,
        userId: Buffer.from(userId.toString()).toString('base64url'),
      }}
    />
  )
}
