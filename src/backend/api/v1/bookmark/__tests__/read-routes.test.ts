import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'

import { CollectionItemSort, DEFAULT_COLLECTION_ITEM_SORT } from '@/backend/api/v1/library/item-sort'
import { BOOKMARKS_PER_PAGE } from '@/constants/policy'

import { createRouteTestApp } from './route-test-utils'

type BookmarkExportResponse = {
  bookmarks: Array<{
    createdAt: number
    mangaId: number
  }>
}

type BookmarkIdResponse = {
  mangaIds: number[]
}

type BookmarkResponse = {
  bookmarks: Array<{
    createdAt: number
    mangaId: number
  }>
  nextCursor: string | null
}

type BookmarkRow = {
  createdAt: Date
  mangaId: number
}

type ExportBookmarksRouteModule = typeof import('../export')

type GetBookmarkIdsRouteModule = typeof import('../id')
type GetBookmarksRouteModule = typeof import('../GET')
type ReadScenario = {
  selectBookmarkError: Error | null
  selectBookmarkIdError: Error | null
  selectBookmarkIdResult: Array<{ mangaId: number }>
  selectBookmarkResult: BookmarkRow[]
}

let exportBookmarksApp: ReturnType<typeof createRouteTestApp>
let exportBookmarksRoute: ExportBookmarksRouteModule['default']
let getBookmarkIdsApp: ReturnType<typeof createRouteTestApp>
let getBookmarkIdsRoute: GetBookmarkIdsRouteModule['default']
let getBookmarksApp: ReturnType<typeof createRouteTestApp>
let getBookmarksRoute: GetBookmarksRouteModule['default']
let scenario: ReadScenario

const selectBookmarkCalls: Array<Record<string, unknown>> = []
const selectBookmarkIdCalls: Array<Record<string, unknown>> = []

mock.module('@/sql/selectBookmark', () => ({
  selectBookmark: async (params: Record<string, unknown>) => {
    selectBookmarkCalls.push(params)

    if (scenario.selectBookmarkError) {
      throw scenario.selectBookmarkError
    }

    return scenario.selectBookmarkResult
  },
  selectBookmarkId: async (params: Record<string, unknown>) => {
    selectBookmarkIdCalls.push(params)

    if (scenario.selectBookmarkIdError) {
      throw scenario.selectBookmarkIdError
    }

    return scenario.selectBookmarkIdResult
  },
}))

afterAll(() => {
  mock.restore()
})

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})

  getBookmarksRoute = (await import('../GET')).default
  getBookmarkIdsRoute = (await import('../id')).default
  exportBookmarksRoute = (await import('../export')).default

  getBookmarksApp = createRouteTestApp(getBookmarksRoute)
  getBookmarkIdsApp = createRouteTestApp(getBookmarkIdsRoute)
  exportBookmarksApp = createRouteTestApp(exportBookmarksRoute)
})

beforeEach(() => {
  scenario = {
    selectBookmarkError: null,
    selectBookmarkIdError: null,
    selectBookmarkIdResult: [],
    selectBookmarkResult: [],
  }

  selectBookmarkCalls.length = 0
  selectBookmarkIdCalls.length = 0
})

describe('GET /api/v1/bookmark', () => {
  test('기본 목록을 반환하고 기본 조회 파라미터를 전달한다', async () => {
    const firstCreatedAt = new Date('2025-01-03T12:00:00.000Z')
    const secondCreatedAt = new Date('2025-01-02T12:00:00.000Z')

    scenario.selectBookmarkResult = [
      { mangaId: 100, createdAt: firstCreatedAt },
      { mangaId: 200, createdAt: secondCreatedAt },
    ]

    const response = await getBookmarksApp.request('/', {}, { userId: 1 })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('private')
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(selectBookmarkCalls).toEqual([
      {
        userId: 1,
        limit: BOOKMARKS_PER_PAGE + 1,
        sort: DEFAULT_COLLECTION_ITEM_SORT,
      },
    ])

    const data = (await response.json()) as BookmarkResponse

    expect(data).toEqual({
      bookmarks: [
        { mangaId: 100, createdAt: firstCreatedAt.getTime() },
        { mangaId: 200, createdAt: secondCreatedAt.getTime() },
      ],
      nextCursor: null,
    })
  })

  test('cursor와 sort를 해석하고 nextCursor를 계산한다', async () => {
    const cursorDate = new Date('2025-01-05T00:00:00.000Z')
    const firstCreatedAt = new Date('2025-01-04T00:00:00.000Z')
    const secondCreatedAt = new Date('2025-01-03T00:00:00.000Z')
    const thirdCreatedAt = new Date('2025-01-02T00:00:00.000Z')

    scenario.selectBookmarkResult = [
      { mangaId: 400, createdAt: firstCreatedAt },
      { mangaId: 500, createdAt: secondCreatedAt },
      { mangaId: 600, createdAt: thirdCreatedAt },
    ]

    const response = await getBookmarksApp.request(
      `/?cursor=${cursorDate.getTime()}-300&limit=2&sort=${CollectionItemSort.MANGA_ID_ASC}`,
      {},
      { userId: 1 },
    )

    expect(response.status).toBe(200)
    expect(selectBookmarkCalls).toEqual([
      {
        userId: 1,
        limit: 3,
        sort: CollectionItemSort.MANGA_ID_ASC,
        cursorMangaId: 300,
        cursorTime: cursorDate,
      },
    ])

    const data = (await response.json()) as BookmarkResponse

    expect(data).toEqual({
      bookmarks: [
        { mangaId: 400, createdAt: firstCreatedAt.getTime() },
        { mangaId: 500, createdAt: secondCreatedAt.getTime() },
      ],
      nextCursor: `${secondCreatedAt.getTime()}-500`,
    })
  })

  test('유효하지 않은 cursor면 400을 반환하고 조회하지 않는다', async () => {
    const response = await getBookmarksApp.request('/?cursor=invalid', {}, { userId: 1 })

    expect(response.status).toBe(400)
    expect(selectBookmarkCalls).toHaveLength(0)
  })

  test('유효하지 않은 limit이나 sort면 400을 반환한다', async () => {
    const invalidLimitResponse = await getBookmarksApp.request('/?limit=0', {}, { userId: 1 })
    const invalidSortResponse = await getBookmarksApp.request('/?sort=invalid', {}, { userId: 1 })

    expect(invalidLimitResponse.status).toBe(400)
    expect(invalidSortResponse.status).toBe(400)
    expect(selectBookmarkCalls).toHaveLength(0)
  })

  test('인증되지 않은 사용자는 401을 반환한다', async () => {
    const response = await getBookmarksApp.request('/', {}, {})

    expect(response.status).toBe(401)
    expect(selectBookmarkCalls).toHaveLength(0)
  })

  test('조회 중 오류가 나면 500을 반환한다', async () => {
    scenario.selectBookmarkError = new Error('Database connection failed')

    const response = await getBookmarksApp.request('/', {}, { userId: 1 })

    expect(response.status).toBe(500)
    expect(selectBookmarkCalls).toHaveLength(1)
  })
})

describe('GET /api/v1/bookmark/id', () => {
  test('북마크 ID 목록을 반환한다', async () => {
    scenario.selectBookmarkIdResult = [{ mangaId: 100 }, { mangaId: 200 }, { mangaId: 300 }]

    const response = await getBookmarkIdsApp.request('/', {}, { userId: 1 })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('private')
    expect(selectBookmarkIdCalls).toEqual([{ userId: 1 }])

    const data = (await response.json()) as BookmarkIdResponse

    expect(data).toEqual({ mangaIds: [100, 200, 300] })
  })

  test('인증되지 않은 사용자는 401을 반환한다', async () => {
    const response = await getBookmarkIdsApp.request('/', {}, {})

    expect(response.status).toBe(401)
    expect(selectBookmarkIdCalls).toHaveLength(0)
  })

  test('조회 중 오류가 나면 500을 반환한다', async () => {
    scenario.selectBookmarkIdError = new Error('Database connection failed')

    const response = await getBookmarkIdsApp.request('/', {}, { userId: 1 })

    expect(response.status).toBe(500)
    expect(selectBookmarkIdCalls).toEqual([{ userId: 1 }])
  })
})

describe('GET /api/v1/bookmark/export', () => {
  test('북마크 export 목록을 반환한다', async () => {
    const createdAt = new Date('2025-01-03T12:00:00.000Z')

    scenario.selectBookmarkResult = [
      { mangaId: 100, createdAt },
      { mangaId: 200, createdAt: new Date('2025-01-02T12:00:00.000Z') },
    ]

    const response = await exportBookmarksApp.request('/', {}, { userId: 1 })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('private')
    expect(selectBookmarkCalls).toEqual([{ userId: 1 }])

    const data = (await response.json()) as BookmarkExportResponse

    expect(data.bookmarks[0]).toEqual({ mangaId: 100, createdAt: createdAt.getTime() })
    expect(data.bookmarks).toHaveLength(2)
  })

  test('인증되지 않은 사용자는 401을 반환한다', async () => {
    const response = await exportBookmarksApp.request('/', {}, {})

    expect(response.status).toBe(401)
    expect(selectBookmarkCalls).toHaveLength(0)
  })

  test('조회 중 오류가 나면 500을 반환한다', async () => {
    scenario.selectBookmarkError = new Error('Database connection failed')

    const response = await exportBookmarksApp.request('/', {}, { userId: 1 })

    expect(response.status).toBe(500)
    expect(selectBookmarkCalls).toEqual([{ userId: 1 }])
  })
})
