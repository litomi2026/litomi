export type Manga = {
  id: number
  artists?: string[]
  characters?: string[]
  date: string
  group?: string[]
  related?: number[]
  series?: string[]
  tags?: string[]
  title: string
  type: string
  images: MangaImage[]
  cdn?: string
}

type MangaImage = {
  name: string
  width?: number
  height?: number
}
