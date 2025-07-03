import { captureException } from '@sentry/nextjs'

import { translateSearchQuery } from '@/app/(navigation)/search/searchUtils'
import { Manga } from '@/types/manga'

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
  3: '아티스트CG',
  4: '게임CG',
  5: '서양',
  6: '이미지모음',
  7: '건전',
  8: '코스프레',
  9: '아시안',
  10: '기타',
  11: '비공개',
} as const

type Params3 = {
  search: string
  minViews?: number
  maxViews?: number
  minPages?: number
  maxPages?: number
  startDate?: number
  endDate?: number
  sort?: 'id_asc' | 'popular' | 'random'
  nextId?: string
  offset?: number
  categories?: string
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

export async function searchMangasFromKHentai({
  search,
  minViews,
  maxViews,
  minPages,
  maxPages,
  startDate,
  endDate,
  sort,
  nextId,
  offset,
  categories,
}: Params3) {
  const { cleanedSearch, extractedCategories } = parseSearchAndCategories({ categories, search })

  const searchParams = new URLSearchParams({
    ...(cleanedSearch && { search: translateSearchQuery(cleanedSearch) }),
    ...(nextId && { 'next-id': nextId }),
    ...(sort && { sort }),
    ...(offset && { offset: String(offset) }),
    ...(extractedCategories && { categories: extractedCategories }),
    ...(minViews && { 'min-views': String(minViews) }),
    ...(maxViews && { 'max-views': String(maxViews) }),
    ...(minPages && { 'min-pages': String(minPages) }),
    ...(maxPages && { 'max-pages': String(maxPages) }),
    ...(startDate && { 'start-date': String(startDate) }),
    ...(endDate && { 'end-date': String(endDate) }),
  })

  const res = await fetch(`https://k-hentai.org/ajax/search?${searchParams}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 86400 }, // 1 day
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('k-hentai.org 서버 오류 - 만화 검색', { extra: { res, body } })
    throw new Error('k 서버에서 만화 검색을 실패했어요.')
  }

  return ((await res.json()) as KHentaiManga[])
    .filter((manga) => manga.archived === 1)
    .map((manga) => convertKHentaiMangaToManga(manga))
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

function convertKHentaiMangaToManga(manga: KHentaiManga): Manga {
  return {
    ...convertKHentaiCommonToManga(manga),
    images: [manga.thumb],
  }
}

function extractTypeFilter(searchQuery: string) {
  const TYPE_PATTERN = /\btype:(\S+)/i
  const typeMatch = searchQuery.match(TYPE_PATTERN)

  if (!typeMatch) {
    return {
      categories: null,
      cleanedSearch: searchQuery,
    }
  }

  const categoriesValue = typeMatch[1] // e.g., "1,2,3"
  const searchWithoutType = searchQuery.replace(/\btype:\S+/gi, '').trim()

  return {
    categories: categoriesValue,
    cleanedSearch: searchWithoutType,
  }
}

function parseSearchAndCategories({ categories, search }: { categories?: string; search?: string }) {
  if (categories || !search) {
    return {
      cleanedSearch: search,
      extractedCategories: categories,
    }
  }

  const { categories: extractedCategories, cleanedSearch } = extractTypeFilter(search)

  return {
    cleanedSearch: extractedCategories ? cleanedSearch : search,
    extractedCategories: extractedCategories || categories,
  }
}
