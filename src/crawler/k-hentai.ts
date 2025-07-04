import { captureException } from '@sentry/nextjs'

import { convertQueryKey } from '@/app/(navigation)/search/searchUtils'
import { Manga } from '@/types/manga'

import { NotFoundError } from './common'

export interface KHentaiManga extends KHentaiMangaCommon {
  torrents: Torrent[]
}

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
  sort?: '' | 'id_asc' | 'popular'
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

const typeNameToNumber: Record<string, string> = {
  동인지: '1',
  doujinshi: '1',
  망가: '2',
  manga: '2',
  아티스트cg: '3',
  아티스트_cg: '3',
  artistcg: '3',
  artist_cg: '3',
  게임cg: '4',
  게임_cg: '4',
  game_cg: '4',
  gamecg: '4',
  서양: '5',
  western: '5',
  이미지모음: '6',
  이미지_모음: '6',
  imageset: '6',
  image_set: '6',
  건전: '7',
  'non-h': '7',
  코스프레: '8',
  cosplay: '8',
  아시안: '9',
  asian: '9',
  기타: '10',
  other: '10',
  misc: '10',
  비공개: '11',
  private: '11',
}

const queryKeyKoreanToEnglish: Record<string, string> = {
  언어: 'language',
  여성: 'female',
  여: 'female',
  남성: 'male',
  남: 'male',
  기타: 'other',
  혼합: 'mixed',
  작가: 'artist',
  그룹: 'group',
  캐릭터: 'character',
  시리즈: 'series',
  종류: 'type',
}

type Params3 = {
  url: string
  searchParams: {
    query?: string
    sort?: 'id_asc' | 'popular' | 'random'
    'min-view'?: number
    'max-view'?: number
    'min-page'?: number
    'max-page'?: number
    from?: number
    to?: number
    nextId?: string
    skip?: number
  }
}

export function convertKHentaiMangaToManga(manga: KHentaiManga): Manga {
  return {
    ...convertKHentaiCommonToManga(manga),
    images: [manga.thumb],
  }
}

export async function fetchMangaFromKHentai({ id }: { id: number }) {
  const res = await fetch(`https://k-hentai.org/r/${id}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 28800 }, // 8 hours
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('k-hentai.org 서버 오류 - 만화', { extra: { res, body } })
    throw new Error('k 서버에서 만화를 불러오는데 실패했어요.')
  }

  const html = await res.text()
  const match = html.match(/const\s+gallery\s*=\s*(\{[\s\S]*?\});/s)

  if (!match) {
    captureException('k-hentai.org `gallery` 변수 못 찾음', { extra: { res } })
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
    captureException('k-hentai.org 서버 오류 - 만화 목록', { extra: { res, body } })
    throw new Error('k 서버에서 만화 목록을 불러오는데 실패했어요.')
  }

  return ((await res.json()) as KHentaiManga[])
    .filter((manga) => manga.archived === 1)
    .map((manga) => convertKHentaiMangaToManga(manga))
}

export async function fetchRandomMangasFromKHentai() {
  const searchParams = new URLSearchParams({
    search: 'language:korean',
    sort: 'random',
  })

  const res = await fetch(`https://k-hentai.org/ajax/search?${searchParams}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 15 },
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('k-hentai.org 서버 오류 - 랜덤 만화 목록', { extra: { res, body } })
    throw new Error('k 서버에서 랜덤 만화 목록을 불러오는데 실패했어요.')
  }

  return ((await res.json()) as KHentaiManga[])
    .filter((manga) => manga.archived === 1)
    .map((manga) => convertKHentaiMangaToManga(manga))
}

export function getCategories(query?: string) {
  const typeMatch = query?.match(/\btype:(\S+)/i)
  if (!typeMatch) return

  return typeMatch[1]
    .split(',')
    .map((value) => {
      const normalized = value.trim().toLowerCase().replace(/\s+/g, '')
      if (/^\d+$/.test(normalized)) {
        return normalized
      }
      return typeNameToNumber[normalized] || value
    })
    .filter(Boolean)
    .join(',')
}

export async function searchMangasFromKHentai({ url, searchParams }: Params3) {
  const {
    query,
    sort,
    'min-view': minView,
    'max-view': maxView,
    'min-page': minPage,
    'max-page': maxPage,
    from,
    to,
    nextId,
    skip,
  } = searchParams
  const lowerEnglishQuery = convertQueryKey(translateQuery(query?.toLowerCase()))
  const categories = getCategories(lowerEnglishQuery)
  const search = lowerEnglishQuery?.replace(/\btype:\S+/gi, '').trim()

  const searchParams2 = new URLSearchParams({
    ...(search && { search }),
    ...(nextId && { 'next-id': nextId }),
    ...(sort && { sort }),
    ...(skip && { offset: String(skip) }),
    ...(categories && { categories }),
    ...(minView && { 'min-views': String(minView) }),
    ...(maxView && { 'max-views': String(maxView) }),
    ...(minPage && { 'min-pages': String(minPage) }),
    ...(maxPage && { 'max-pages': String(maxPage) }),
    ...(from && { 'start-date': String(from) }),
    ...(to && { 'end-date': String(to) }),
  })

  console.log('👀 - searchMangasFromKHentai - searchParams2:', searchParams2.toString())
  const response = await fetch(`${url}?${searchParams2}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 86400 }, // 1 day
  })

  if (response.status === 404) {
    throw new NotFoundError('검색 결과를 찾을 수 없습니다.')
  }

  if (!response.ok) {
    const body = await response.text()
    captureException('k-hentai.org 서버 오류 - 만화 검색', { extra: { response, body } })
    throw new Error('k 서버에서 만화 검색을 실패했어요.')
  }

  const data = (await response.json()) as KHentaiManga[]
  const mangas = data.filter((manga) => manga.archived === 1)

  if (mangas.length === 0) {
    throw new NotFoundError('검색 결과를 찾을 수 없습니다.')
  }

  return mangas.map((manga) => convertKHentaiMangaToManga(manga))
}

export function translateQuery(query?: string) {
  if (!query) return

  let translatedQuery = query

  Object.entries(queryKeyKoreanToEnglish).forEach(([korean, english]) => {
    const regex = new RegExp(`\\b${korean}(?=:)`, 'gi')
    translatedQuery = translatedQuery.replace(regex, english)
  })

  return translatedQuery
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
    rating: manga.rating / 100,
    viewCount: manga.views,
  }
}

function convertKHentaiGalleryToManga(manga: KHentaiGallery): Manga {
  return {
    ...convertKHentaiCommonToManga(manga),
    images: manga.files.map((file) => file.image.url),
  }
}
