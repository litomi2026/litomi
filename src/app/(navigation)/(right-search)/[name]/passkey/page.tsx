import { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { sql } from 'drizzle-orm'
import { Metadata } from 'next'
import { cookies } from 'next/headers'

import type { PageProps } from '@/types/nextjs'

import { CANONICAL_URL, defaultOpenGraph, SHORT_NAME } from '@/constants'
import { db } from '@/database/drizzle'
import { decodeDeviceType } from '@/database/enum'
import { credentialTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { getUsernameFromParam } from '@/utils/param'

import { getUserById } from '../common'
import Forbidden from './Forbidden'
import GuestView from './GuestView'
import PasskeyList from './PasskeyList'

export const metadata: Metadata = {
  title: `패스키 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `패스키 - ${SHORT_NAME}`,
    url: `${CANONICAL_URL}/@/passkey`,
  },
  alternates: {
    canonical: '/@/passkey',
    languages: { ko: '/@/passkey' },
  },
}

type Params = {
  name: string
}

export default async function PasskeyPage({ params }: PageProps<Params>) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore, false)

  if (!userId) {
    return <GuestView />
  }

  const [loginUser, { name }] = await Promise.all([getUserById(userId), params])
  const usernameFromParam = getUsernameFromParam(name)

  if (loginUser.name !== usernameFromParam) {
    return <Forbidden />
  }

  const credentials = await db
    .select({
      id: credentialTable.id,
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

  return <PasskeyList passkeys={passkeys} username={usernameFromParam} />
}
