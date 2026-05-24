export enum ChallengeType {
  REGISTRATION = 1,
  AUTHENTICATION = 2,
}

export enum DeviceType {
  UNKNOWN = 0,
  PLATFORM = 1,
  CROSS_PLATFORM = 2,
}

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
