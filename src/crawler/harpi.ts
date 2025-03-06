// https://transform.tools/typescript-to-javascript
// https://jsonformatter.org/8f087a
// https://pk3.harpi.in/

import { Manga } from '@/types/manga'

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

async function fetchMangas({ page }: FetchHarpiMangasParams) {
  try {
    const response = await fetch(`/animation/list?page=${page}&pageLimit=10`)
    const result = await response.json()
    const mangas: Manga[] = result.data.map((manga: HarpiManga) => ({
      id: +manga.parseKey,
      artists: manga.authors,
      characters: manga.characters,
      date: manga.date,
      group: manga.groups,
      series: manga.series,
      tags: manga.tagsIds,
      title: manga.title,
      type: manga.type,
      images: sortImageURLs(manga.imageUrl).map((url) => ({
        name: url,
      })),
      cdn: 'HARPI',
    }))
    return mangas
  } catch (error) {
    console.log(`Failed to fetch page ${page}`)
    console.log('👀 - error:', error)
    return null
  }
}

async function main() {
  const mangaById: Record<number, Manga> = {}

  for (let page = 1; page < 6; page++) {
    console.log('👀 ~ page:', page)
    const mangas = await fetchMangas({ page })
    mangas?.forEach((manga) => {
      mangaById[manga.id] = manga
    })
    await sleep(4000)
  }

  console.log(JSON.stringify(mangaById))
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function sortImageURLs(items: string[]) {
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
