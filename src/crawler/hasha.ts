// https://transform.tools/typescript-to-javascript
// https://hasha.in

import { Manga } from '@/types/manga'

import mangas from '../database/hasha.json'
import { prettifyJSON } from './utils'

enum HashaSort {
  DATE = 'date',
  BOOKMARKED_COUNT = 'bookmarkedCount',
}

type FetchHashaMangasParams = {
  page: string
  sort: string
  order: number
}

type HashaImage = {
  name: string
  height?: number
  width?: number
}

type HashaManga = {
  id: number
  artists: string[]
  characters: string[]
  date: string
  mangaId?: number
  group: string[]
  related: number[]
  series: string[]
  tags: string[]
  title: string
  type: string
  images: HashaImage[]
}

async function fetchMangas({ page, sort, order }: FetchHashaMangasParams) {
  try {
    const randomNumber = (Math.random() * 30).toFixed(0).padStart(2, '0')
    const response = await fetch('https://hasha.in/api/manga', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://hasha.in',
        'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/1${randomNumber}.0.0.0 Safari/537.36`,
      },
      body: JSON.stringify({ page, sort, order }),
    })
    const result = await response.json()
    const mangas: Manga[] = result.data.map((manga: HashaManga) => ({
      id: manga.mangaId,
      artists: manga.artists,
      characters: manga.characters,
      date: manga.date,
      group: manga.group,
      related: manga.related,
      series: manga.series,
      tags: manga.tags,
      title: manga.title,
      type: manga.type,
      images: manga.images.map((img: HashaImage) => img.name),
    }))
    return mangas
  } catch (error) {
    console.log(`Failed to fetch page ${page}`, error)
    await sleep(60_000)
    return []
  }
}

async function main() {
  const fetchedMangaById: Record<string, Manga> = {}

  for (let page = 1; page <= 5; page++) {
    console.log('👀 ~ page:', page)
    const mangas = await fetchMangas({
      page: String(page),
      sort: HashaSort.DATE,
      order: -1,
    })
    if (mangas.length > 0) {
      mangas.forEach((manga) => {
        fetchedMangaById[manga.id] = manga
      })
    } else {
      page--
    }
    await sleep(1000)
  }

  const mergedMangas: Record<number, Manga> = { ...fetchedMangaById, ...mangas }
  prettifyJSON({ pathname: '../database/hasha.json', json: mergedMangas })
  console.log('Hasha manga updated successfully.')
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

main()
