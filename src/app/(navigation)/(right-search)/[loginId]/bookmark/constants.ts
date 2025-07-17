import { BookmarkSource } from '@/database/schema'
import { Manga } from '@/types/manga'

export const BOOKMARKS_PER_PAGE = 20
export const MANGA_DETAILS_BATCH_SIZE = 10

export const EXAMPLE_BOOKMARKED_MANGAS: Manga[] = [
  {
    id: 3291051,
    artists: [{ value: 'fence_14', label: 'fence_14' }],
    date: 'Thu Mar 27 2025 17:06:26 GMT+0000 (Coordinated Universal Time)',
    group: [],
    series: [{ value: 'original', label: '오리지널' }],
    tags: [
      {
        category: 'male',
        value: 'sole_male',
        label: '남:단독 남성',
      },
      {
        category: 'female',
        value: 'big_breasts',
        label: '여:거유',
      },
      {
        category: 'female',
        value: 'impregnation',
        label: '여:수정 후 착상',
      },
      {
        category: 'female',
        value: 'sister',
        label: '여:여동생/누나/언니',
      },
      {
        category: 'female',
        value: 'sole_female',
        label: '여:단독 여성',
      },
      {
        category: 'female',
        value: 'sumata',
        label: '여:스마타',
      },
      {
        category: 'mixed',
        value: 'incest',
        label: '혼합:근친상간',
      },
      {
        category: 'other',
        value: 'full_color',
        label: '기타:풀컬러',
      },
    ],
    title: '[Fence14] Giji SEX Kyoudai 0~2 【Kinshinsoukan】 | 유사 섹스 남매 0~2 【근친상간】 [Korean] [Team Edge]',
    type: '동인지',
    language: 'korean',
    cdn: 'ehgt.org',
    count: 49,
    rating: 4.61,
    viewCount: 18473,
    images: ['https://ehgt.org/w/01/803/23614-9k29mjjp.webp'],
  },
  {
    id: 3059184,
    artists: [{ value: 'k-vam', label: 'k-vam' }],
    date: 'Sun Sep 15 2024 18:28:00 GMT+0000 (Coordinated Universal Time)',
    group: [],
    series: [],
    tags: [
      {
        category: 'male',
        value: 'military',
        label: '남:군대',
      },
      {
        category: 'male',
        value: 'shaved_head',
        label: '남:shaved head',
      },
      {
        category: 'female',
        value: 'big_breasts',
        label: '여:거유',
      },
      {
        category: 'female',
        value: 'glasses',
        label: '여:안경',
      },
      {
        category: 'female',
        value: 'military',
        label: '여:군대',
      },
      {
        category: 'other',
        value: '3d',
        label: '기타:3D',
      },
      {
        category: 'other',
        value: 'multi-work_series',
        label: '기타:연작 시리즈',
      },
      {
        category: 'other',
        value: 'story_arc',
        label: '기타:서사물',
      },
    ],
    title: '[k-vam] 걸스 투 입대띵',
    type: '기타',
    language: 'korean',
    cdn: 'ehgt.org',
    count: 970,
    rating: 1.42,
    viewCount: 2192,
    images: ['https://ehgt.org/w/01/538/47924-nrgupfye.webp'],
  },
]

export type BookmarkExportData = {
  exportedAt: string
  totalCount: number
  bookmarks: ExportedBookmark[]
}

export type ExportedBookmark = {
  mangaId: number
  source: BookmarkSource
  createdAt: string
}
