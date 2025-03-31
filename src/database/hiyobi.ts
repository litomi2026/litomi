export interface HyobiListPage {
  artists: LabelValue[]
  category: number
  characters: LabelValue[]
  comments: number
  count: number
  filecount: number
  groups: LabelValue[]
  id: number
  language: string
  like: number
  like_anonymous: number
  parodys: LabelValue[]
  tags: LabelValue[]
  title: string
  type: number
  uid: number
  uploader: number
  uploadername: string
}

export interface LabelValue {
  display: string
  value: string
}

export async function fetchMangasFromHiyobi({ page }: { page: number }) {
  const res = await fetch(`https://api.hiyobi.org/list/${page}`, { referrerPolicy: 'no-referrer' })

  if (!res.ok) {
    throw new Error('Failed to fetch mangas from 1')
  }

  const mangas = (await res.json()).list as HyobiListPage[]
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
}: HyobiListPage) {
  const images = [getThumbnailURL(id)]
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
    cdn: 'k-hentai',
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

function getThumbnailURL(id: number) {
  const millions = Math.floor(id / 1_000_000)
  const thousands = Math.floor((id % 1_000_000) / 1_000)
  const remainder = id % 1_000
  return `${millions}/${thousands}/${remainder}`
}
