import { prettifyJSON } from '@/crawler/utils'
import { harpiTagMap } from '@/database/harpi-tag'
import { Multilingual, normalizeTagValue, translateTagValue } from '@/database/tag-translations'
import { Manga, Tag } from '@/types/manga'

import mangas from '../src/database/harpi.json'

// Type for existing manga data in harpi.json
type ExistingMangaData = {
  id: number
  artists?: string[]
  characters?: string[]
  date: string
  group?: string[]
  series?: string[]
  tags?: string[]
  title: string
  type?: string
  images: string[]
  cdn?: string
}

type FetchHarpiMangasParams = {
  page: number
}

type HarpiManga = {
  // id: string
  parseKey: string
  title: string
  // engTitle: string
  // korTitle: string
  type: string
  authors: string[]
  groups?: string[]
  series: string[]
  // tagsEngStr: string[]
  // tagsKorStr: string[]
  tagsIds: string[]
  characters?: string[]
  date: string
  imageUrl: string[]
  // isUserDirectUpload: boolean
  // uploader: string
  // createdAt: string
  // updatedAt: string
}

function convertHarpiTagIdsToTags(tagIds: string[]): Tag[] {
  const currentLanguage = 'ko' // TODO: Get from user preferences or context
  const tags: Tag[] = []

  for (const tagId of tagIds) {
    const harpiTag = harpiTagMap[tagId]
    if (!harpiTag) continue

    const [, valueStr] = harpiTag.engStr.split(':')
    if (!valueStr) continue

    // Map harpi gender to our category
    let category: Tag['category']
    switch (harpiTag.gender) {
      case 'E':
        category = 'other'
        break
      case 'F':
        category = 'female'
        break
      case 'M':
        category = 'male'
        break
      default:
        continue
    }

    const normalizedValue = normalizeTagValue(valueStr)

    tags.push({
      category,
      value: normalizedValue,
      label: translateTagValue(normalizedValue, currentLanguage as keyof Multilingual),
    })
  }

  return tags
}

async function fetchMangas({ page }: FetchHarpiMangasParams): Promise<Manga[] | null> {
  try {
    const response = await fetch(`https://pk3.harpi.in/animation/list?page=${page}&pageLimit=10&sort=date_desc`)
    const result = await response.json()
    const fetchedMangas: Manga[] = result.data.map((manga: HarpiManga) => ({
      id: +manga.parseKey,
      artists: manga.authors,
      characters: manga.characters,
      date: manga.date,
      group: manga.groups,
      series: manga.series,
      tags: convertHarpiTagIdsToTags(manga.tagsIds),
      title: manga.title,
      type: manga.type,
      images: sortImageURLs(manga.imageUrl),
      cdn: 'HARPI',
    }))
    return fetchedMangas
  } catch (error) {
    console.error(`Failed to fetch page ${page}`, error)
    return null
  }
}

async function main() {
  // 새로 가져온 데이터를 id를 key로 하는 객체에 누적합니다.
  const fetchedMangaById: Record<number, Manga> = {}

  // 1~5 페이지를 순차적으로 fetch (rate limit을 고려해 각 페이지 후 4초 지연)
  for (let page = 1; page < 6; page++) {
    console.log('👀 Fetching harpi page:', page)
    const fetchedMangas = await fetchMangas({ page })
    if (fetchedMangas) {
      fetchedMangas.forEach((manga) => {
        fetchedMangaById[manga.id] = manga
      })
    }
    await sleep(1000)
  }

  // Convert existing manga data to new format
  const convertedExistingMangas: Record<number, Manga> = {}
  const existingMangas = mangas as unknown as Record<string, ExistingMangaData>

  for (const [id, manga] of Object.entries(existingMangas)) {
    convertedExistingMangas[+id] = {
      ...manga,
      tags:
        manga.tags && Array.isArray(manga.tags) && typeof manga.tags[0] === 'string'
          ? convertHarpiTagIdsToTags(manga.tags)
          : [],
    }
  }

  const mergedMangas: Record<number, Manga> = { ...convertedExistingMangas, ...fetchedMangaById }
  prettifyJSON({ pathname: '../database/harpi.json', json: mergedMangas })
  console.log('Harpi manga updated successfully.')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sortImageURLs(items: string[]): string[] {
  return items.sort((a, b) => {
    const regex = /_(\d+)\.(\w+)$/
    const matchA = a.match(regex)
    const matchB = b.match(regex)
    const numA = matchA ? parseInt(matchA[1], 10) : 0
    const numB = matchB ? parseInt(matchB[1], 10) : 0
    return numA - numB
  })
}

main()
