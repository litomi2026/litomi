import { APP_ORIGIN } from '@litomi/domain/constants'
import { AuthenticatorTransportFuture } from '@simplewebauthn/server'

export type Passkey = {
  id: number
  credentialId: string
  createdAt: Date
  deviceType: string | null
  lastUsedAt: Date | null
  transports?: AuthenticatorTransportFuture[] | null
}

export type PasskeySignalData = {
  credentialIds: string[]
  displayName: string
  name: string
  userId: string
}

export type PasskeyUserDetailsSignalData = Pick<PasskeySignalData, 'displayName' | 'name' | 'userId'>

export const WEBAUTHN_ORIGIN = APP_ORIGIN
export const WEBAUTHN_RP_ID = new URL(APP_ORIGIN).hostname
export const WEBAUTHN_RP_NAME = 'litomi'
