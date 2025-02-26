// https://transform.tools/typescript-to-javascript

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

type Params = {
  page: string
  sort: string
  order: number
}

type Img = {
  name: string
}

type Manga = {
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
  images: Img[]
}

async function fetchMangas({ page, sort, order }: Params) {
  try {
    const response = await fetch('/api/manga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, sort, order }),
    })
    const result = await response.json()
    const mangas: Manga[] = result.data.map((manga: Manga) => ({
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
      images: manga.images.map((img: Img) => ({
        name: img.name,
      })),
    }))
    return mangas
  } catch (error) {
    console.log(`Failed to fetch page ${page}`)
    console.log('👀 - error:', error)
    return []
  }
}

const mangaById: Record<number, Manga> = {}

async function main() {
  for (let page = 6; page < 10; page++) {
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
  console.log('👀 - id:', JSON.stringify(mangaById))
}

main()
