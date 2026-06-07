import { CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'

export const CENSORSHIP_KEYS = [
  CensorshipKey.ARTIST,
  CensorshipKey.GROUP,
  CensorshipKey.SERIES,
  CensorshipKey.CHARACTER,
  CensorshipKey.TAG,
  CensorshipKey.TAG_CATEGORY_FEMALE,
  CensorshipKey.TAG_CATEGORY_MALE,
  CensorshipKey.TAG_CATEGORY_MIXED,
  CensorshipKey.TAG_CATEGORY_OTHER,
  CensorshipKey.LANGUAGE,
  CensorshipKey.UPLOADER,
  CensorshipKey.TYPE,
] as const

export const CENSORSHIP_KEY_MESSAGE_PATHS = {
  [CensorshipKey.ARTIST]: 'common.keys.artist',
  [CensorshipKey.GROUP]: 'common.keys.group',
  [CensorshipKey.SERIES]: 'common.keys.series',
  [CensorshipKey.CHARACTER]: 'common.keys.character',
  [CensorshipKey.TAG]: 'common.keys.tag',
  [CensorshipKey.TAG_CATEGORY_FEMALE]: 'common.keys.tagCategoryFemale',
  [CensorshipKey.TAG_CATEGORY_MALE]: 'common.keys.tagCategoryMale',
  [CensorshipKey.TAG_CATEGORY_MIXED]: 'common.keys.tagCategoryMixed',
  [CensorshipKey.TAG_CATEGORY_OTHER]: 'common.keys.tagCategoryOther',
  [CensorshipKey.LANGUAGE]: 'common.keys.language',
  [CensorshipKey.UPLOADER]: 'common.keys.uploader',
  [CensorshipKey.TYPE]: 'common.keys.type',
} satisfies Record<CensorshipKey, string>

export const CENSORSHIP_CATEGORIES = [
  { prefix: 'artist:', key: CensorshipKey.ARTIST, defaultSuggestion: true },
  { prefix: 'group:', key: CensorshipKey.GROUP, defaultSuggestion: true },
  { prefix: 'series:', key: CensorshipKey.SERIES, defaultSuggestion: true },
  { prefix: 'character:', key: CensorshipKey.CHARACTER, defaultSuggestion: true },
  { prefix: 'female:', key: CensorshipKey.TAG_CATEGORY_FEMALE, defaultSuggestion: true },
  { prefix: 'male:', key: CensorshipKey.TAG_CATEGORY_MALE, defaultSuggestion: true },
  { prefix: 'mixed:', key: CensorshipKey.TAG_CATEGORY_MIXED, defaultSuggestion: true },
  { prefix: 'other:', key: CensorshipKey.TAG_CATEGORY_OTHER, defaultSuggestion: true },
  { prefix: 'language:', key: CensorshipKey.LANGUAGE, defaultSuggestion: true },
  { prefix: 'uploader:', key: CensorshipKey.UPLOADER, defaultSuggestion: true },
  { prefix: 'type:', key: CensorshipKey.TYPE, defaultSuggestion: false },
] as const

export const DEFAULT_CENSORSHIP_VALUES = [
  { key: CensorshipKey.TAG, value: 'bestiality', messagePath: 'common.blindTags.bestiality' },
  { key: CensorshipKey.TAG, value: 'guro', messagePath: 'common.blindTags.guro' },
  { key: CensorshipKey.TAG, value: 'snuff', messagePath: 'common.blindTags.guro' },
  { key: CensorshipKey.TAG, value: 'yaoi', messagePath: 'common.blindTags.bl' },
  { key: CensorshipKey.TAG, value: 'males_only', messagePath: 'common.blindTags.bl' },
  { key: CensorshipKey.TAG, value: 'scat', messagePath: 'common.blindTags.scat' },
  { key: CensorshipKey.TAG, value: 'coprophagia', messagePath: 'common.blindTags.scat' },
  { key: CensorshipKey.GROUP, value: 'zenmai_kourogi', messagePath: 'common.blindTags.zenmaiKourogi' },
] as const

export const CENSORSHIP_LEVELS = [
  { level: CensorshipLevel.LIGHT, messagePath: 'common.levels.light', colorClass: 'text-yellow-500' },
  { level: CensorshipLevel.HEAVY, messagePath: 'common.levels.heavy', colorClass: 'text-red-500' },
  { level: CensorshipLevel.NONE, messagePath: 'common.levels.none', colorClass: 'text-green-500' },
] as const
