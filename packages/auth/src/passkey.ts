type Options = {
  credentialIds?: string[]
  displayName: string
  name: string
  userId: string
}

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

export async function signalCurrentPasskeyUserDetails({ credentialIds, displayName, name, userId }: Options) {
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
      }),
    )
  }

  if (credentialIds && signalApi?.signalAllAcceptedCredentials) {
    tasks.push(
      signalApi.signalAllAcceptedCredentials({
        allAcceptedCredentialIds: credentialIds,
        rpId,
        userId,
      }),
    )
  }

  if (tasks.length === 0) {
    return false
  }

  await Promise.allSettled(tasks)
  return true
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

function getPasskeyRpId() {
  const hostname = globalThis.location?.hostname?.trim()

  if (!hostname) {
    throw new Error('패스키 RP ID를 확인할 수 없어요')
  }

  return hostname
}

function getPublicKeyCredentialSignalApi(): PublicKeyCredentialSignalApi | null {
  if (typeof PublicKeyCredential === 'undefined') {
    return null
  }

  return PublicKeyCredential as PublicKeyCredentialSignalApi
}
