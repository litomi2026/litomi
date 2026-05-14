import { afterEach, describe, expect, mock, test } from 'bun:test'

import { signalCurrentPasskeyUserDetails, signalUnknownPasskeyCredential } from '../passkey'

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

  test('syncPasskeyState는 credentialIds가 있으면 관련 signal API를 호출한다', async () => {
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

    const result = await signalCurrentPasskeyUserDetails({
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

  test('syncPasskeyState는 빈 credentialIds도 accepted credentials signal로 전달한다', async () => {
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

    const result = await signalCurrentPasskeyUserDetails({
      credentialIds: [],
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
      allAcceptedCredentialIds: [],
      rpId: 'example.com',
      userId: 'MTIz',
    })
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

  test('syncPasskeyState는 credentialIds 없이 사용자 정보만 동기화할 수 있다', async () => {
    const signalCurrentUserDetails = mock(() => Promise.resolve())
    const signalAllAcceptedCredentials = mock(() => Promise.resolve())

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

    const result = await signalCurrentPasskeyUserDetails({
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
    expect(signalAllAcceptedCredentials).not.toHaveBeenCalled()
  })
})
