import { AuthenticatorTransportFuture } from '@simplewebauthn/server'
import { Bluetooth, Cable, Cpu, CreditCard, Fingerprint, Key, Nfc, Smartphone, SquareAsterisk, Usb } from 'lucide-react'

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
    const fakeCredentialId = btoa(credentialHash).replace(/=/g, '').slice(0, 43)

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
        label: '내장 인증',
        bgColor: 'bg-brand/10',
      }
    default:
      return {
        icon: <Key className="size-6 text-zinc-400" />,
        label: '알 수 없는 인증',
        bgColor: 'bg-zinc-800',
      }
  }
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

export function getTransportIcon(transport: AuthenticatorTransportFuture) {
  switch (transport) {
    case 'ble':
      return <Bluetooth className="size-3" />
    case 'cable':
      return <Cable className="size-3" />
    case 'hybrid':
      return <Smartphone className="size-3" />
    case 'internal':
      return <Cpu className="size-3" />
    case 'nfc':
      return <Nfc className="size-3" />
    case 'smart-card':
      return <CreditCard className="size-3" />
    case 'usb':
      return <Usb className="size-3" />
    default:
      return null
  }
}

const labelMap: Record<AuthenticatorTransportFuture, string | undefined> = {
  usb: 'USB',
  nfc: 'NFC',
  ble: '블루투스',
  internal: '내장',
  hybrid: '혼합',
  'smart-card': '스마트카드',
  cable: 'Cable',
}

export function getTransportLabel(transport?: AuthenticatorTransportFuture | null) {
  if (!transport) {
    return ''
  }

  return labelMap[transport]
}

export function getTruncatedId(id: string): string {
  if (id.length <= 12) {
    return id
  }
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}

export function getUserVerificationMethod(deviceType: string) {
  switch (deviceType) {
    case 'cross-platform':
      return {
        icon: <SquareAsterisk className="size-3" />,
        label: 'PIN/터치',
      }
    case 'platform':
      return {
        icon: <Fingerprint className="size-3" />,
        label: '생체 인증',
      }
    default:
      return {
        icon: <Key className="size-3" />,
        label: '알 수 없는 인증',
      }
  }
}

export function hasCredentialId<T extends { credentialId: string | null }>(
  value: T,
): value is T & { credentialId: string } {
  return value.credentialId !== null
}
