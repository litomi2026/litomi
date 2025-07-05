export type Manga = {
  id: number
  artists?: string[]
  characters?: string[]
  date?: string
  group?: string[]
  related?: number[]
  series?: string[]
  tags?: Tag[]
  title: string
  type?: string
  images: string[]
  cdn?: string
  count?: number
  like?: number
  likeAnonymous?: number
  viewCount?: number
  rating?: number
}

export type Tag = {
  category: '' | 'female' | 'male' | 'mixed' | 'other'
  value: string // "big_breasts"
  label: string // "큰 가슴"
}
