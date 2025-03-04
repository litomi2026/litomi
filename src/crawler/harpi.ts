// https://transform.tools/typescript-to-javascript
// https://jsonformatter.org/8f087a

import { Manga } from '@/types/manga'

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

type Params = {
  page: number
}

export async function main() {
  const mangaById: Record<number, Manga> = {}

  for (let page = 1; page < 6; page++) {
    console.log('👀 ~ page:', page)
    const mangas = await fetchMangas({ page })
    mangas?.forEach((manga) => {
      mangaById[manga.id] = manga
    })
    await sleep(4000)
  }
  console.log('👀 - id:', JSON.stringify(mangaById))
}

async function fetchMangas({ page }: Params) {
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
      images: manga.imageUrl.map((url) => ({
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

main()
