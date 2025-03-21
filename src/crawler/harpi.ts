import { Manga } from '@/types/manga'

import mangas from '../database/manga.json'
import { prettifyJSON } from './utils'

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
      tags: manga.tagsIds,
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
    console.log('👀 Fetching page:', page)
    const fetchedMangas = await fetchMangas({ page })
    if (fetchedMangas) {
      fetchedMangas.forEach((manga) => {
        fetchedMangaById[manga.id] = manga
      })
    }
    await sleep(4000)
  }

  const mergedMangas: Record<number, Manga> = { ...mangas, ...fetchedMangaById }
  prettifyJSON({ pathname: '../database/manga.json', json: mergedMangas })
  console.log('Manga database updated successfully.')
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
