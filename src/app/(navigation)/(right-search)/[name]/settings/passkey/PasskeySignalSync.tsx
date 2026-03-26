'use client'

import { useEffect, useEffectEvent } from 'react'

import { syncPasskeyCredentialState } from '@/utils/passkey'

type Props = {
  credentialIds: string[]
  displayName: string
  name: string
  userId: string
}

export default function PasskeySignalSync({ credentialIds, displayName, name, userId }: Readonly<Props>) {
  const syncPasskeys = useEffectEvent(async () => {
    await syncPasskeyCredentialState({
      credentialIds,
      displayName,
      name,
      userId,
    })
  })

  useEffect(() => {
    syncPasskeys()
  }, [credentialIds, displayName, name, userId])

  return null
}
