import { Manga } from '@/types/manga'
import fs from 'fs'
import path from 'path'
import prettier from 'prettier'

import mangas from '../database/manga.json' // 기존 데이터: Record<number, Manga>

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

  // 기존 JSON 데이터와 새로 가져온 데이터를 병합합니다.
  // 스프레드 연산자를 사용하면 동일한 키가 있는 경우 후자의 값으로 덮어씁니다.
  const mergedMangas: Record<number, Manga> = { ...mangas, ...fetchedMangaById }

  // Prettier를 사용해 JSON 문자열로 포맷팅한 후 파일에 덮어씁니다.
  const filePath = path.resolve(__dirname, '../database/manga.json')
  const prettierConfig = await prettier.resolveConfig(filePath)

  const formattedJson = await prettier.format(JSON.stringify(mergedMangas), {
    parser: 'json',
    ...prettierConfig,
  })

  fs.writeFileSync(filePath, formattedJson, 'utf-8')
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
