export enum CensorshipKey {
  ARTIST = 1,
  GROUP = 2,
  SERIES = 3,
  CHARACTER = 4,
  TAG = 5,
  TAG_CATEGORY_FEMALE = 6,
  TAG_CATEGORY_MALE = 7,
  TAG_CATEGORY_MIXED = 8,
  TAG_CATEGORY_OTHER = 9,
  LANGUAGE = 10,
}

export enum CensorshipLevel {
  NONE = 0,
  LIGHT = 1,
  HEAVY = 2,
}

export enum ChallengeType {
  REGISTRATION = 1,
  AUTHENTICATION = 2,
}

export enum DeviceType {
  UNKNOWN = 0,
  PLATFORM = 1,
  CROSS_PLATFORM = 2,
}

export enum MangaSource {
  HASHA = 0,
  HARPI = 1,
  HIYOBI = 2,
  K_HENTAI = 3,
  HITOMI = 4,
  // E_HENTAI = 5,
  // EX_HENTAI = 6,
  KOMI = 7,
}

export enum NotificationConditionType {
  SERIES = 1,
  CHARACTER = 2,
  TAG = 3,
  ARTIST = 4,
  GROUP = 5,
  LANGUAGE = 6,
}

export enum NotificationType {
  NEW_MANGA = 0,
  BOOKMARK_UPDATE = 1,
  CRAWL_HISTORY = 2,
}

export enum PostType {
  TEXT = 0,
  POLL = 1,
}

export const NotificationConditionTypeNames = {
  [NotificationConditionType.SERIES]: '시리즈',
  [NotificationConditionType.CHARACTER]: '캐릭터',
  [NotificationConditionType.TAG]: '태그',
  [NotificationConditionType.ARTIST]: '작가',
  [NotificationConditionType.GROUP]: '그룹',
  [NotificationConditionType.LANGUAGE]: '언어',
} as const

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
