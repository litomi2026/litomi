import { afterEach, describe, expect, mock, test } from 'bun:test'

import { signalUnknownPasskeyCredential, syncPasskeyCredentialState } from '../passkey'

const originalLocation = globalThis.location
const originalPublicKeyCredential = globalThis.PublicKeyCredential

describe('패스키 신호 헬퍼', () => {
  afterEach(() => {
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: originalLocation,
      writable: true,
    })
    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      value: originalPublicKeyCredential,
      writable: true,
    })
  })

  test('syncPasskeyCredentialState는 지원되는 경우 signal API를 호출한다', async () => {
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
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { hostname: 'example.com' },
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

  test('syncPasskeyCredentialState는 credential이 없으면 아무 동작도 하지 않는다', async () => {
    const signalAllAcceptedCredentials = mock(() => Promise.resolve())

    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      value: {
        signalAllAcceptedCredentials,
      },
      writable: true,
    })
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { hostname: 'example.com' },
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

  test('signalUnknownPasskeyCredential는 지원되는 경우 브라우저 signal API를 호출한다', async () => {
    const signalUnknownCredential = mock(() => Promise.resolve())

    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true,
      value: {
        signalUnknownCredential,
      },
      writable: true,
    })
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { hostname: 'example.com' },
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
