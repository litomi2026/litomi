import { AuthenticatorTransportFuture } from '@simplewebauthn/server'

export type Passkey = {
  id: number
  credentialId: string
  createdAt: Date
  deviceType: string | null
  lastUsedAt: Date | null
  transports?: AuthenticatorTransportFuture[] | null
}
