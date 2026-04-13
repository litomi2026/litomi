import { createAccessTokenCookies, createRefreshSessionCookies, serializeCookieHeader } from '@test/backend/setup/auth'
import { seedUser } from '@test/backend/setup/db'

type CreateMeSessionAuthContextInput = SeedUserOverrides & {
  deviceLabel?: string
}

type SeedUserOverrides = NonNullable<Parameters<typeof seedUser>[0]>

export async function createMeAuthContext(userOverrides: SeedUserOverrides = {}) {
  const user = await seedUser(userOverrides)
  const auth = await createAccessTokenCookies({ userId: user.id })

  return { auth, user }
}

export async function createMeSessionAuthContext({
  deviceLabel = 'Backend Test Device',
  ...userOverrides
}: CreateMeSessionAuthContextInput = {}) {
  const { auth, user } = await createMeAuthContext(userOverrides)
  const session = await createRefreshSessionCookies({ userId: user.id, deviceLabel })

  return {
    auth,
    user,
    session,
    cookieHeader: serializeCookieHeader([...auth.cookieConfigs, ...session.cookieConfigs]),
  }
}
