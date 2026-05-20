import { db } from '@litomi/db/app'
import { credentialTable } from '@litomi/db/app/passkey'
import { eq } from 'drizzle-orm'

export type PasskeyVerifyTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function readCredentialByCredentialId(tx: PasskeyVerifyTransaction, credentialId: string) {
  const [credential] = await tx
    .select({
      userId: credentialTable.userId,
      publicKey: credentialTable.publicKey,
      counter: credentialTable.counter,
      credentialId: credentialTable.credentialId,
    })
    .from(credentialTable)
    .where(eq(credentialTable.credentialId, credentialId))

  return credential ?? null
}

export async function touchCredentialUse(
  tx: PasskeyVerifyTransaction,
  credentialId: string,
  counter: number,
  lastUsedAt: Date,
) {
  await tx.update(credentialTable).set({ counter, lastUsedAt }).where(eq(credentialTable.credentialId, credentialId))
}
