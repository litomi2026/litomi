export interface Artist {
  artist: string
  url: string
}

export interface Character {
  character: string
  url: string
}

export interface Group {
  group: string
  url: string
}

export interface HitomiFile {
  hasavif: number
  hash: string
  haswebp: number
  height: number
  name: string
  width: number
}

export interface HitomiGallery {
  artists?: Artist[] | null
  blocked: number
  characters?: Character[] | null
  date: string
  datepublished: unknown
  files: HitomiFile[]
  galleryurl: string
  groups?: Group[] | null
  id: string
  japanese_title?: string
  language: string
  language_localname: string
  language_url: string
  languages: Language[] | null
  parodys?: Parody[] | null
  related: number[]
  scene_indexes?: unknown[]
  tags?: Tag[] | null
  title: string
  type: string
  video: unknown
  videofilename: unknown
}

export interface Language {
  galleryid: number
  language_localname: string
  name: string
  url: string
}

export interface Parody {
  parody: string
  url: string
}

export interface Tag {
  female?: number | string
  male?: number | string
  tag: string
  url: string
}
