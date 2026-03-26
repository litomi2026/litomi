import { env } from '@/env/client'

type PublicKeyCredentialSignalApi = typeof PublicKeyCredential & {
  signalAllAcceptedCredentials?: (options: SignalAllAcceptedCredentialsOptions) => Promise<void>
  signalCurrentUserDetails?: (options: SignalCurrentUserDetailsOptions) => Promise<void>
  signalUnknownCredential?: (options: SignalUnknownCredentialOptions) => Promise<void>
}

type SignalAllAcceptedCredentialsOptions = {
  allAcceptedCredentialIds: string[]
  rpId: string
  userId: string
}

type SignalCurrentUserDetailsOptions = {
  displayName: string
  name: string
  rpId: string
  userId: string
}

type SignalUnknownCredentialOptions = {
  credentialId: string
  rpId: string
}

type SyncPasskeyCredentialStateOptions = {
  credentialIds: string[]
  displayName: string
  name: string
  userId: string
}

export async function signalUnknownPasskeyCredential(credentialId: string) {
  const signalApi = getPublicKeyCredentialSignalApi()

  if (!signalApi?.signalUnknownCredential) {
    return false
  }

  try {
    await signalApi.signalUnknownCredential({
      credentialId,
      rpId: getPasskeyRpId(),
    })
    return true
  } catch {
    return false
  }
}

export async function syncPasskeyCredentialState({
  credentialIds,
  displayName,
  name,
  userId,
}: SyncPasskeyCredentialStateOptions) {
  if (credentialIds.length === 0) {
    return false
  }

  const signalApi = getPublicKeyCredentialSignalApi()
  const rpId = getPasskeyRpId()
  const tasks: Promise<void>[] = []

  if (signalApi?.signalCurrentUserDetails) {
    tasks.push(
      signalApi.signalCurrentUserDetails({
        displayName,
        name,
        rpId,
        userId,
      })
    )
  }

  if (signalApi?.signalAllAcceptedCredentials) {
    tasks.push(
      signalApi.signalAllAcceptedCredentials({
        allAcceptedCredentialIds: credentialIds,
        rpId,
        userId,
      })
    )
  }

  if (tasks.length === 0) {
    return false
  }

  await Promise.allSettled(tasks)
  return true
}

function getPasskeyRpId() {
  return new URL(env.NEXT_PUBLIC_CANONICAL_URL).hostname
}

function getPublicKeyCredentialSignalApi(): PublicKeyCredentialSignalApi | null {
  if (typeof PublicKeyCredential === 'undefined') {
    return null
  }

  return PublicKeyCredential as PublicKeyCredentialSignalApi
}
