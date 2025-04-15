import { Manga } from '@/types/manga'
import { captureException } from '@sentry/nextjs'

export interface Artist {
  artist: string
  url: string
}

export interface File {
  hasavif: number
  hash: string
  height: number
  name: string
  width: number
}

export interface HitomiGallery {
  artists: Artist[]
  blocked: number
  characters: unknown
  date: string
  datepublished: unknown
  files: File[]
  galleryurl: string
  groups: unknown
  id: string
  japanese_title: unknown
  language: string
  language_localname: string
  language_url: string
  languages: Language[]
  parodys: Parody[]
  related: number[]
  scene_indexes: unknown[]
  tags: Tag[]
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
  female: string
  male: string
  tag: string
  url: string
}

export async function fetchMangaFromHitomi({ id }: { id: number }) {
  const res = await fetch(`https://ltn.gold-usergeneratedcontent.net/galleries/${id}.js`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 300 }, // 5 minutes
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('ltn.gold-usergeneratedcontent.net 서버 오류 - 만화 정보', { extra: { res, body } })
    throw new Error('hi 서버에서 만화를 불러오는데 실패했어요.')
  }

  const jsText = await res.text()
  const match = jsText.match(/var\s+galleryinfo\s*=\s*(\{[\s\S]*?\});/)

  if (!match) {
    captureException('ltn.gold-usergeneratedcontent.net `galleryinfo` 변수 못 찾음', { extra: { res } })
    return null
  }

  try {
    const gallery = JSON.parse(match[1]) as HitomiGallery
    return convertHitomiGalleryToManga(gallery)
  } catch (error) {
    captureException(error, { extra: { name: 'ltn.gold-usergeneratedcontent.net `galleryinfo` 변수 파싱 오류', res } })
    return null
  }
}

function convertHitomiGalleryToManga(gallery: HitomiGallery): Manga {
  return {
    id: Number(gallery.id),
    title: gallery.title,
    artists: gallery.artists.map((artist) => artist.artist),
    series: gallery.parodys.map((parody) => parody.parody),
    tags: gallery.tags.map((tag) => tag.tag),
    images: gallery.files.map((file) => `https://ltn.gold-usergeneratedcontent.net/1/111/${file.hash}`),
  }
}
