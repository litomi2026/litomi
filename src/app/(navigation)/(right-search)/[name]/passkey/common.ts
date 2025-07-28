import { AuthenticatorTransportFuture } from '@simplewebauthn/server'

export type Passkey = {
  createdAt: Date | null
  deviceType: string | null
  id: string
  transports?: AuthenticatorTransportFuture[] | null
}
