export enum NotificationConditionType {
  SERIES = 1,
  CHARACTER = 2,
  TAG = 3,
  ARTIST = 4,
  GROUP = 5,
  LANGUAGE = 6,
  UPLOADER = 7,
}

export enum NotificationType {
  NEW_MANGA = 0,
  BOOKMARK_UPDATE = 1,
  CRAWL_HISTORY = 2,
  TEST = 3,
}

export const NotificationConditionTypeNames = {
  [NotificationConditionType.SERIES]: '시리즈',
  [NotificationConditionType.CHARACTER]: '캐릭터',
  [NotificationConditionType.TAG]: '태그',
  [NotificationConditionType.ARTIST]: '작가',
  [NotificationConditionType.GROUP]: '그룹',
  [NotificationConditionType.LANGUAGE]: '언어',
  [NotificationConditionType.UPLOADER]: '업로더',
} as const

export type NotificationData = {
  url?: string
  artists?: string[]
  previewImageURL?: string
  mangaId?: number
}
