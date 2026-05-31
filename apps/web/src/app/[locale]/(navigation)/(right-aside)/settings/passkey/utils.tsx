import type { AuthenticatorTransportFuture } from '@simplewebauthn/server'

import { getDefaultPasskeyName } from '@litomi/domain/auth/model'
import { Fingerprint, Key, Smartphone, SquareAsterisk, Usb } from 'lucide-react'

export function generateFakeCredentials(loginId: string): Array<{
  id: string
  transports?: AuthenticatorTransportFuture[]
}> {
  const encoder = new TextEncoder()
  const data = encoder.encode(loginId)

  let hash = 0
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data[i]
    hash = hash & hash
  }

  const numCredentials = 1 + (Math.abs(hash) % 3)
  const credentials = []

  for (let i = 0; i < numCredentials; i++) {
    const credentialHash = Math.abs(hash + i * 12345)
      .toString(16)
      .padStart(16, '0')
    const fakeCredentialId = btoa(credentialHash).replaceAll('=', '').slice(0, 43)

    const transportIndex = (hash + i) % 4
    let transports: AuthenticatorTransportFuture[]

    switch (transportIndex) {
      case 0:
        transports = ['internal']
        break
      case 1:
        transports = ['usb']
        break
      case 2:
        transports = ['hybrid']
        break
      default:
        transports = ['internal', 'hybrid']
        break
    }

    credentials.push({
      id: fakeCredentialId,
      transports,
    })
  }

  return credentials
}

export function getDeviceInfo(deviceType: string) {
  switch (deviceType) {
    case 'cross-platform':
      return {
        icon: <Usb className="size-6 text-brand" />,
        label: '외부 보안키',
        bgColor: 'bg-brand/10',
      }
    case 'platform':
      return {
        icon: <Smartphone className="size-6 text-brand" />,
        label: '내장 패스키',
        bgColor: 'bg-brand/10',
      }
    default:
      return {
        icon: <Key className="size-6 text-zinc-400" />,
        label: '패스키',
        bgColor: 'bg-zinc-800',
      }
  }
}

export function getPasskeyDisplayName(name: string | null, deviceType: string | null) {
  const trimmedName = name?.trim()
  return trimmedName || getDefaultPasskeyName(deviceType ?? '')
}

export function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '방금 전'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}일 전`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}년 전`
}

export function getUserVerificationMethod(deviceType: string) {
  switch (deviceType) {
    case 'cross-platform':
      return {
        icon: <SquareAsterisk className="size-3" />,
        label: 'PIN 또는 터치',
      }
    case 'platform':
      return {
        icon: <Fingerprint className="size-3" />,
        label: '생체 인증 또는 기기 잠금',
      }
    default:
      return null
  }
}

export function hasCredentialId<T extends { credentialId: string | null }>(
  value: T,
): value is T & { credentialId: string } {
  return value.credentialId !== null
}
