import { afterEach, describe, expect, mock, test } from 'bun:test'

import { signalUnknownPasskeyCredential, syncPasskeyCredentialState } from '../passkey'

const originalPublicKeyCredential = globalThis.PublicKeyCredential

describe('passkey signal helpers', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      value: originalPublicKeyCredential,
      writable: true,
    })
  })

  test('syncPasskeyCredentialState calls signal APIs when supported', async () => {
    const signalAllAcceptedCredentials = mock(() => Promise.resolve())
    const signalCurrentUserDetails = mock(() => Promise.resolve())

    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      value: {
        signalAllAcceptedCredentials,
        signalCurrentUserDetails,
      },
      writable: true,
    })

    const result = await syncPasskeyCredentialState({
      credentialIds: ['cred-1', 'cred-2'],
      displayName: '테스터',
      name: 'tester',
      userId: 'MTIz',
    })

    expect(result).toBe(true)
    expect(signalCurrentUserDetails).toHaveBeenCalledWith({
      displayName: '테스터',
      name: 'tester',
      rpId: 'example.com',
      userId: 'MTIz',
    })
    expect(signalAllAcceptedCredentials).toHaveBeenCalledWith({
      allAcceptedCredentialIds: ['cred-1', 'cred-2'],
      rpId: 'example.com',
      userId: 'MTIz',
    })
  })

  test('syncPasskeyCredentialState is a no-op when there are no credentials', async () => {
    const signalAllAcceptedCredentials = mock(() => Promise.resolve())

    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      value: {
        signalAllAcceptedCredentials,
      },
      writable: true,
    })

    const result = await syncPasskeyCredentialState({
      credentialIds: [],
      displayName: '테스터',
      name: 'tester',
      userId: 'MTIz',
    })

    expect(result).toBe(false)
    expect(signalAllAcceptedCredentials).not.toHaveBeenCalled()
  })

  test('signalUnknownPasskeyCredential calls the browser signal API when supported', async () => {
    const signalUnknownCredential = mock(() => Promise.resolve())

    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      value: {
        signalUnknownCredential,
      },
      writable: true,
    })

    const result = await signalUnknownPasskeyCredential('cred-1')

    expect(result).toBe(true)
    expect(signalUnknownCredential).toHaveBeenCalledWith({
      credentialId: 'cred-1',
      rpId: 'example.com',
    })
  })
})
