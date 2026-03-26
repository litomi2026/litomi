import { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { desc, eq } from 'drizzle-orm'

import { decodeDeviceType } from '@/database/enum'
import { db } from '@/database/supabase/drizzle'
import { credentialTable } from '@/database/supabase/passkey'

import PasskeyList from './PasskeyList'
import PasskeySignalSync from './PasskeySignalSync'
import { getTruncatedId } from './utils'

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
    credentialId: getTruncatedId(credential.credentialId),
    deviceType: decodeDeviceType(credential.deviceType),
    transports: credential.transports as AuthenticatorTransportFuture[],
  }))

  return (
    <>
      <PasskeySignalSync
        credentialIds={credentials.map((credential) => credential.credentialId)}
        displayName={displayName}
        name={loginId}
        userId={Buffer.from(userId.toString()).toString('base64url')}
      />
      <PasskeyList passkeys={passkeys} />
    </>
  )
}
