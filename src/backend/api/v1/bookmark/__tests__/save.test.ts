import { beforeAll, describe, expect, test } from 'bun:test'

type SaveBookmarksModule = typeof import('../save')

type SaveBookmarksResult = {
  createdMangaIds: number[]
  duplicateCount: number
  overflowCount: number
}

type SaveTxScenario = {
  currentCount?: number
  expansionAmount?: number
  existingIds?: number[]
}

let BookmarkLimitReachedError: SaveBookmarksModule['BookmarkLimitReachedError']
let saveBookmarks: SaveBookmarksModule['saveBookmarks']

beforeAll(async () => {
  const saveBookmarksModule = await import('../save')
  saveBookmarks = saveBookmarksModule.saveBookmarks
  BookmarkLimitReachedError = saveBookmarksModule.BookmarkLimitReachedError
})

function createSaveTx(scenario: SaveTxScenario = {}) {
  const insertedValues: Array<Array<{ createdAt?: Date; mangaId: number; userId: number }>> = []
  let selectCallCount = 0

  return {
    insertedValues,
    tx: {
      select: () => ({
        from: () => ({
          where: async () => {
            const currentCall = ++selectCallCount

            if (currentCall === 1) {
              return (scenario.existingIds ?? []).map((mangaId) => ({ mangaId }))
            }

            if (currentCall === 2) {
              return [{ totalAmount: scenario.expansionAmount ?? 0 }]
            }

            if (currentCall === 3) {
              return [{ count: scenario.currentCount ?? 0 }]
            }

            throw new Error(`Unexpected select call: ${currentCall}`)
          },
        }),
      }),
      insert: () => ({
        values: (values: Array<{ createdAt?: Date; mangaId: number; userId: number }>) => {
          insertedValues.push(values)

          return {
            returning: async () => values.map(({ mangaId }) => ({ mangaId })),
          }
        },
      }),
    },
  }
}

describe('saveBookmarks', () => {
  test('빈 입력이면 즉시 빈 결과를 반환한다', async () => {
    const { tx, insertedValues } = createSaveTx()

    const result = await saveBookmarks(tx as never, 1, [])

    expect(result).toEqual<SaveBookmarksResult>({
      createdMangaIds: [],
      duplicateCount: 0,
      overflowCount: 0,
    })
    expect(insertedValues).toHaveLength(0)
  })

  test('신규 북마크를 저장하고 생성된 id 목록을 반환한다', async () => {
    const { tx, insertedValues } = createSaveTx({ currentCount: 0, existingIds: [] })

    const result = await saveBookmarks(tx as never, 1, [{ mangaId: 101 }, { mangaId: 102 }])

    expect(result).toEqual<SaveBookmarksResult>({
      createdMangaIds: [101, 102],
      duplicateCount: 0,
      overflowCount: 0,
    })
    expect(insertedValues).toEqual([
      [
        { userId: 1, mangaId: 101 },
        { userId: 1, mangaId: 102 },
      ],
    ])
  })

  test('이미 존재하는 북마크는 duplicateCount로만 집계한다', async () => {
    const { tx, insertedValues } = createSaveTx({ existingIds: [101] })

    const result = await saveBookmarks(tx as never, 1, [{ mangaId: 101 }])

    expect(result).toEqual<SaveBookmarksResult>({
      createdMangaIds: [],
      duplicateCount: 1,
      overflowCount: 0,
    })
    expect(insertedValues).toHaveLength(0)
  })

  test('기존 북마크와 신규 북마크가 섞여 있으면 신규만 저장한다', async () => {
    const { tx, insertedValues } = createSaveTx({ currentCount: 1, existingIds: [101] })

    const result = await saveBookmarks(tx as never, 1, [{ mangaId: 101 }, { mangaId: 102 }, { mangaId: 103 }])

    expect(result).toEqual<SaveBookmarksResult>({
      createdMangaIds: [102, 103],
      duplicateCount: 1,
      overflowCount: 0,
    })
    expect(insertedValues).toEqual([
      [
        { userId: 1, mangaId: 102 },
        { userId: 1, mangaId: 103 },
      ],
    ])
  })

  test('요청 내부 중복은 첫 등장만 유지한다', async () => {
    const { tx, insertedValues } = createSaveTx({ currentCount: 0, existingIds: [] })

    const result = await saveBookmarks(tx as never, 1, [
      { mangaId: 101 },
      { mangaId: 101 },
      { mangaId: 102 },
      { mangaId: 102 },
    ])

    expect(result).toEqual<SaveBookmarksResult>({
      createdMangaIds: [101, 102],
      duplicateCount: 0,
      overflowCount: 0,
    })
    expect(insertedValues).toEqual([
      [
        { userId: 1, mangaId: 101 },
        { userId: 1, mangaId: 102 },
      ],
    ])
  })

  test('남은 슬롯보다 많으면 가능한 만큼만 저장하고 overflowCount를 반환한다', async () => {
    const { tx, insertedValues } = createSaveTx({ currentCount: 498, existingIds: [] })

    const result = await saveBookmarks(tx as never, 1, [{ mangaId: 101 }, { mangaId: 102 }, { mangaId: 103 }])

    expect(result).toEqual<SaveBookmarksResult>({
      createdMangaIds: [101, 102],
      duplicateCount: 0,
      overflowCount: 1,
    })
    expect(insertedValues).toEqual([
      [
        { userId: 1, mangaId: 101 },
        { userId: 1, mangaId: 102 },
      ],
    ])
  })

  test('남은 슬롯이 없으면 BookmarkLimitReachedError를 던진다', async () => {
    const { tx, insertedValues } = createSaveTx({ currentCount: 500, existingIds: [] })

    await expect(saveBookmarks(tx as never, 1, [{ mangaId: 101 }])).rejects.toBeInstanceOf(BookmarkLimitReachedError)

    expect(insertedValues).toHaveLength(0)
  })
})
