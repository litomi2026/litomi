export enum TagCategory {
  FEMALE = 0,
  MALE = 1,
  MIXED = 2,
  OTHER = 3,
}

export const tagCategoryIntToName: Record<number, string> = {
  [TagCategory.FEMALE]: 'female',
  [TagCategory.MALE]: 'male',
  [TagCategory.MIXED]: 'mixed',
  [TagCategory.OTHER]: 'other',
}

export const tagCategoryNameToInt: Record<string, TagCategory> = {
  female: TagCategory.FEMALE,
  male: TagCategory.MALE,
  mixed: TagCategory.MIXED,
  other: TagCategory.OTHER,
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
  HENTAIPAW = 8,
  LITOMI = 9,
  HENTKOR = 10,
}

export enum MangaType {
  DOUJINSHI = 1,
  MANGA = 2,
  ARTIST_CG = 3,
  GAME_CG = 4,
  WESTERN = 5,
  IMAGE_SET = 6,
  NON_H = 7,
  COSPLAY = 8,
  ASIAN_PORN = 9,
  MISC = 10,
  HIDDEN = 11,
}

export const MANGA_TYPE_VALUE_BY_ID: Record<number, string> = {
  [MangaType.DOUJINSHI]: 'doujinshi',
  [MangaType.MANGA]: 'manga',
  [MangaType.ARTIST_CG]: 'artist_cg',
  [MangaType.GAME_CG]: 'game_cg',
  [MangaType.WESTERN]: 'western',
  [MangaType.IMAGE_SET]: 'image_set',
  [MangaType.NON_H]: 'non-h',
  [MangaType.COSPLAY]: 'cosplay',
  [MangaType.ASIAN_PORN]: 'asian',
  [MangaType.MISC]: 'misc',
  [MangaType.HIDDEN]: 'private',
}

export type ImageVariant = {
  url: string
  width?: number
  height?: number
}

export type ImageWithVariants = {
  original?: ImageVariant
  thumbnail?: ImageVariant
  medium?: ImageVariant
}

export type LabeledValue = {
  label: string
  value: string
}

export interface LabeledValueWithLink extends LabeledValue {
  links?: LabeledValue[]
}

export type Manga = {
  id: number
  title: string
  images?: ImageWithVariants[]
  artists?: LabeledValueWithLink[]
  bookmarkCount?: number
  characters?: LabeledValueWithLink[]
  count?: number
  date?: string
  description?: string
  filesize?: number
  group?: LabeledValue[]
  languages?: LabeledValue[]
  like?: number
  likeAnonymous?: number
  lines?: string[]
  rating?: number
  ratingCount?: number
  related?: number[]
  series?: LabeledValue[]
  source?: MangaSource
  sources?: MangaSource[]
  tags?: MangaTag[]
  torrentCount?: number
  torrents?: MangaTorrent[]
  type?: LabeledValue
  uploader?: string
  viewCount?: number

  // Harpi
  harpiId?: string
}

export type MangaError = Manga & {
  isError: true
}

export type MangaTag = LabeledValue & {
  category: string
}

export type MangaTorrent = {
  added: number
  fsize: number
  hash: string
  name: string
  tsize: number
}
