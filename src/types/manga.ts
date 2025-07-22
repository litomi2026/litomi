export type LabeledValue = {
  label: string
  value: string
}

export type Manga = {
  id: number
  images: string[]
  artists?: LabeledValue[]
  characters?: LabeledValue[]
  date?: string
  group?: LabeledValue[]
  related?: number[]
  series?: LabeledValue[]
  tags?: MangaTag[]
  title: string
  type?: string
  languages?: LabeledValue[]
  cdn?: string
  count?: number
  like?: number
  likeAnonymous?: number
  viewCount?: number
  rating?: number

  // Harpi
  harpiId?: string
}

export type MangaTag = LabeledValue & {
  category: MangaTagCategory
}

export type MangaTagCategory = '' | 'female' | 'male' | 'mixed' | 'other'
