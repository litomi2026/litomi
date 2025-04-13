import { Manga } from '@/types/manga'
import { captureException } from '@sentry/nextjs'

interface File {
  id: string
  image: Image
  name: string
  thumbnail: Thumbnail
}

interface Image {
  extension: string
  height: number
  id: string
  orientation: string
  server: number
  size: number
  url: string
  width: number
}

interface KHentaiGallery extends KHentaiMangaCommon {
  files: File[]
}

interface KHentaiManga extends KHentaiMangaCommon {
  torrents: Torrent[]
}

interface KHentaiMangaCommon {
  archived: number
  blocked: number
  category: number
  current_gid: number
  current_key: number
  expunged: number
  filecount: number
  filesize: number
  first_gid: number
  first_key: string
  id: number
  parent_gid: number
  parent_key: string
  posted: number
  rating: number
  tags: Tag[]
  thumb: string
  thumb_extension: string
  title: string
  title_jpn: string
  token: string
  torrentcount: number
  updated: number
  uploader: string
  views: number
}

type Params = {
  nextId?: string
  sort?: 'date_asc' | 'popular' | 'random'
  offset?: string
}

interface Tag {
  id: number
  tag: string[]
}

interface Thumbnail {
  extension: string
  height: number
  id: string
  orientation: string
  server: number
  size: number
  url: string
  width: number
}

interface Torrent {
  added: number
  fsize: number
  hash: string
  name: string
  tsize: number
}

const kHentaiTypeMap = {
  1: '동인지',
  2: '망가',
  3: '아티스트 CG',
  4: '게임 CG',
  5: '서양',
  6: '이미지 모음',
  7: '건전',
  8: '코스프레',
  9: '아시안',
  10: '기타',
  11: '비공개',
} as const

export async function fetchMangaFromKHentai({ id }: { id: number }) {
  const res = await fetch(`https://k-hentai.org/r/${id}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 28800 }, // 8 hours
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('k-hentai.org 서버 오류', { extra: { res, body } })
    throw new Error('k 서버에서 만화 이미지를 불러오는데 실패했어요.')
  }

  const html = await res.text()
  const match = html.match(/const\s+gallery\s*=\s*(\{[\s\S]*?\});/s)

  if (!match) {
    captureException('k-hentai.org gallery 변수 못 찾음', { extra: { res } })
    return null
  }

  try {
    const gallery = JSON.parse(match[1]) as KHentaiGallery
    return convertKHentaiGalleryToManga(gallery)
  } catch (error) {
    captureException(error, { extra: { name: 'k-hentai.org gallery 변수 파싱 오류', res } })
    return null
  }
}

export async function fetchMangasFromKHentai({ nextId, sort, offset }: Params = {}) {
  const searchParams = new URLSearchParams({
    search: 'language:korean',
    ...(nextId && { 'next-id': nextId }),
    ...(sort && { sort }),
    ...(offset && { offset }),
  })

  const res = await fetch(`https://k-hentai.org/ajax/search?${searchParams}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 28800 }, // 8 hours
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('k-hentai.org 서버 오류', { extra: { res, body } })
    throw new Error('k 서버에서 만화 목록을 불러오는데 실패했어요.')
  }

  const mangas = (await res.json()) as KHentaiManga[]
  return mangas.map((manga) => convertKHentaiMangaToManga(manga))
}

function convertKHentaiCommonToManga(manga: KHentaiMangaCommon) {
  return {
    id: manga.id,
    artists: manga.tags.filter(({ tag }) => tag[0] === 'artist').map(({ tag }) => tag[1]),
    date: new Date(manga.posted * 1000).toString(),
    group: manga.tags.filter(({ tag }) => tag[0] === 'group').map(({ tag }) => tag[1]),
    series: manga.tags.filter(({ tag }) => tag[0] === 'parody').map(({ tag }) => tag[1]),
    tags: manga.tags
      .filter(({ tag }) => ['female', 'male', 'mixed', 'other'].includes(tag[0]))
      .map(({ tag }) => tag.join(':')),
    title: manga.title,
    type: kHentaiTypeMap[manga.category as keyof typeof kHentaiTypeMap] ?? '?',
    cdn: 'ehgt.org',
    count: manga.filecount,
    rating: manga.rating,
    viewCount: manga.views,
  }
}

function convertKHentaiGalleryToManga(manga: KHentaiGallery): Manga {
  return {
    ...convertKHentaiCommonToManga(manga),
    images: manga.files.map((file) => file.image.url),
  }
}

function convertKHentaiMangaToManga(manga: KHentaiManga): Manga {
  return {
    ...convertKHentaiCommonToManga(manga),
    images: [manga.thumb],
  }
}
