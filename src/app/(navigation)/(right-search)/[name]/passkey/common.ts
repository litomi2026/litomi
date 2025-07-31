import { AuthenticatorTransportFuture } from '@simplewebauthn/server'

export type Passkey = {
  createdAt: Date
  deviceType: string | null
  id: string
  lastUsedAt: Date
  transports?: AuthenticatorTransportFuture[] | null
}
