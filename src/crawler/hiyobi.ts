import { captureException } from '@sentry/nextjs'

type HiyobiImage = {
  height: number
  name: string
  url: string
  width: number
}
type HiyobiLabelValue = {
  display: string
  value: string
}

type HiyobiManga = {
  artists: HiyobiLabelValue[]
  category: number
  characters: HiyobiLabelValue[]
  comments: number
  count: number
  filecount: number
  groups: HiyobiLabelValue[]
  id: number
  language: string
  like: number
  like_anonymous: number
  parodys: HiyobiLabelValue[]
  tags: HiyobiLabelValue[]
  title: string
  type: number
  uid: number
  uploader: number
  uploadername: string
}

export async function fetchMangaFromHiyobi({ id }: { id: number }) {
  const res = await fetch(`https://api.hiyobi.org/gallery/${id}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 604800 }, // 1 week
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('api.hiyobi.org 서버 오류', { extra: { res, body } })
    throw new Error('hi 서버에서 만화를 불러오는데 실패했어요.')
  }

  const manga = (await res.json()) as HiyobiManga
  return convertHiyobiToManga(manga)
}

export async function fetchMangaImagesFromHiyobi({ id }: { id: number }) {
  const res = await fetch(`https://api-kh.hiyobi.org/hiyobi/list?id=${id}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 86400 }, // 1 day
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('api-kh.hiyobi.org 서버 오류', { extra: { res, body } })
    throw new Error('hi 서버에서 만화 이미지를 불러오는데 실패했어요.')
  }

  const hiyobiImages = (await res.json()) as HiyobiImage[]
  return hiyobiImages.map((image) => image.url)
}

/** @deprecated */
export async function fetchMangaImagesFromKHentai({ id }: { id: number }) {
  const res = await fetch(`https://k-hentai.org/hiyobi/list?id=${id}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 86400 }, // 1 day
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('k-hentai.org 서버 오류', { extra: { res, body } })
    throw new Error('k 서버에서 만화 이미지를 불러오는데 실패했어요.')
  }

  const hiyobiImages = (await res.json()) as HiyobiImage[]
  return hiyobiImages.map((image) => image.url)
}

export async function fetchMangasFromHiyobi({ page }: { page: number }) {
  const res = await fetch(`https://api.hiyobi.org/list/${page}`, {
    referrerPolicy: 'no-referrer',
    next: { revalidate: 86400 }, // 1 day
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('api.hiyobi.org 서버 오류', { extra: { res, body } })
    throw new Error('hi 서버에서 만화 목록을 불러오는데 실패했어요.')
  }

  const mangas = (await res.json()).list as HiyobiManga[]
  return mangas.map((manga) => convertHiyobiToManga(manga))
}

export async function fetchRandomMangasFromHiyobi() {
  const res = await fetch('https://api.hiyobi.org/random', {
    method: 'POST',
    referrerPolicy: 'no-referrer',
    next: { revalidate: 15 },
  })

  if (res.status === 404) {
    return null
  } else if (!res.ok) {
    const body = await res.text()
    captureException('api.hiyobi.org 서버 오류', { extra: { res, body } })
    throw new Error('hi 서버에서 랜덤 만화 목록을 불러오는데 실패했어요.')
  }

  const mangas = (await res.json()) as HiyobiManga[]
  return mangas.map((manga) => convertHiyobiToManga(manga))
}

function convertHiyobiToManga({
  id,
  artists,
  characters,
  groups,
  parodys,
  tags,
  title,
  type,
  filecount,
  count,
  like,
  like_anonymous,
}: HiyobiManga) {
  const images = [getKHentaiThumbnailURL(id)]
  images.length = filecount
  return {
    id,
    artists: artists.map((artist) => artist.display),
    characters: characters.map((character) => character.display),
    // date: date,
    group: groups.map((group) => group.display),
    series: parodys.map((series) => series.display),
    tags: tags.map((tag) => tag.display),
    title,
    type: hiyobiTypeMap[type as keyof typeof hiyobiTypeMap] ?? '?',
    images,
    cdn: 'thumb.k-hentai',
    count,
    like,
    like_anonymous,
  }
}

const hiyobiTypeMap = {
  1: '동인지',
  2: '망가',
  3: '아티스트 CG',
  4: '?게임 CG',
  5: '?서양',
  6: '이미지 모음',
  7: '?건전',
  8: '?코스프레',
  9: '?아시안',
  10: '기타',
} as const

function getKHentaiThumbnailURL(id: number) {
  const millions = Math.floor(id / 1_000_000)
  const thousands = Math.floor((id % 1_000_000) / 1_000)
  const remainder = id % 1_000
  return `${millions}/${thousands}/${remainder}`
}
