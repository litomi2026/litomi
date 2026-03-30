import { AuthenticatorTransportFuture } from '@simplewebauthn/server'

import { APP_ORIGIN } from '@/constants'

export type Passkey = {
  id: number
  credentialId: string
  createdAt: Date
  deviceType: string | null
  lastUsedAt: Date | null
  transports?: AuthenticatorTransportFuture[] | null
}

export const WEBAUTHN_ORIGIN = APP_ORIGIN
export const WEBAUTHN_RP_ID = new URL(APP_ORIGIN).hostname
export const WEBAUTHN_RP_NAME = 'litomi'
