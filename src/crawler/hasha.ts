// https://transform.tools/typescript-to-javascript
// https://jsonformatter.org/8f087a
// https://hasha.in

import { Manga } from '@/types/manga'

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
    const response = await fetch('/api/manga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      images: manga.images.map((img: HashaImage) => ({
        name: img.name,
        height: img.height,
        width: img.width,
      })),
    }))
    return mangas
  } catch (error) {
    console.log(`Failed to fetch page ${page}`)
    console.log('👀 - error:', error)
    return []
  }
}

async function main() {
  const mangaById: Record<string, Manga> = {}

  for (let page = 1; page < 6; page++) {
    console.log('👀 ~ page:', page)
    const mangas = await fetchMangas({
      page: String(page),
      sort: 'date',
      order: -1,
    })
    mangas.forEach((manga) => {
      mangaById[manga.id] = manga
    })
    await sleep(4000)
  }

  console.log(JSON.stringify(mangaById))
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

main()
