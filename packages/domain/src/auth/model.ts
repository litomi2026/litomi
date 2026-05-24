export enum ChallengeType {
  REGISTRATION = 1,
  AUTHENTICATION = 2,
}

export enum DeviceType {
  UNKNOWN = 0,
  PLATFORM = 1,
  CROSS_PLATFORM = 2,
}

export type DecodedDeviceType = '' | 'cross-platform' | 'platform'

export function decodeDeviceType(deviceType: number) {
  switch (deviceType) {
    case DeviceType.CROSS_PLATFORM:
      return 'cross-platform'
    case DeviceType.PLATFORM:
      return 'platform'
    case DeviceType.UNKNOWN:
    default:
      return ''
  }
}

export function encodeDeviceType(authenticatorAttachment?: string) {
  switch (authenticatorAttachment) {
    case 'cross-platform':
      return DeviceType.CROSS_PLATFORM
    case 'platform':
      return DeviceType.PLATFORM
    default:
      return DeviceType.UNKNOWN
  }
}

export function getDefaultPasskeyName(deviceType: string | DecodedDeviceType | DeviceType | null | undefined) {
  switch (deviceType) {
    case 'cross-platform':
    case DeviceType.CROSS_PLATFORM:
      return '외부 보안키'
    case DeviceType.PLATFORM:
    case 'platform':
      return '이 기기의 패스키'
    case '':
    case DeviceType.UNKNOWN:
    default:
      return '패스키'
  }
}
