import '@test/setup.dom'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestQueryClient, createTestQueryClientWrapper, renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

type UseMangaListCachedQueryModule = typeof import('./useMangaListCachedQuery')

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch> | null = null
let importVersion = 0
let useMangaListCachedQuery!: UseMangaListCachedQueryModule['default']

async function importFreshUseMangaListCachedQuery(): Promise<UseMangaListCachedQueryModule> {
  return import(`./useMangaListCachedQuery?test=${importVersion++}`) as Promise<UseMangaListCachedQueryModule>
}

function MangaTitleList({ mangaIds }: { mangaIds: number[] }) {
  const { mangaMap } = useMangaListCachedQuery({ mangaIds })

  return (
    <ul>
      {mangaIds.map((id) => (
        <li key={id}>{mangaMap.get(id)?.title ?? '불러오는 중'}</li>
      ))}
    </ul>
  )
}

function SingleMangaTitle({ mangaId }: { mangaId: number }) {
  const { mangaMap } = useMangaListCachedQuery({ mangaIds: [mangaId] })

  return <div>{mangaMap.get(mangaId)?.title ?? 'loading'}</div>
}

beforeEach(async () => {
  ;({ default: useMangaListCachedQuery } = await importFreshUseMangaListCachedQuery())
})

afterEach(() => {
  fetchController?.restore()
  fetchController = null
  fetchRoutes = []
  cleanup()
})

describe('useMangaListCachedQuery', () => {
  test('route 전환 후에는 아직 시작되지 않은 queued 요청을 보내지 않는다', async () => {
    let resolveManga1: (() => void) | undefined
    let resolveManga2: (() => void) | undefined

    fetchRoutes = [1, 2, 3, 4, 5].map((id) => ({
      matcher: ({ url }) => url.pathname === `/api/proxy/manga/${id}`,
      response: () => {
        if (id === 1) {
          return new Promise<Response>((resolve) => {
            resolveManga1 = () => {
              resolve(jsonResponse({ id: 1, title: 'Manga 1', images: [] }))
            }
          })
        }

        if (id === 2) {
          return new Promise<Response>((resolve) => {
            resolveManga2 = () => {
              resolve(jsonResponse({ id: 2, title: 'Manga 2', images: [] }))
            }
          })
        }

        return jsonResponse({ id, title: `Manga ${id}`, images: [] })
      },
    }))
    fetchController = installMockFetch(() => fetchRoutes)

    const view = renderWithTestQueryClient(<MangaTitleList mangaIds={[1, 2, 3, 4, 5]} />)

    await waitFor(() => {
      const requestedIds = new Set(fetchController?.calls.map(({ url }) => Number(url.pathname.split('/').pop())) ?? [])
      expect(requestedIds).toEqual(new Set([1, 2]))
    })

    view.unmount()

    await waitFor(() => {
      expect(resolveManga1).toBeDefined()
      expect(resolveManga2).toBeDefined()
    })

    resolveManga1?.()
    resolveManga2?.()

    await waitFor(() => {
      const requestedIds = fetchController?.calls.map(({ url }) => Number(url.pathname.split('/').pop())) ?? []
      expect(requestedIds).toEqual([1, 2])
    })
  })

  test('route 전환으로 observer가 사라져도 진행 중인 요청은 유지되고 캐시에 남는다', async () => {
    let resolveManga101: (() => void) | undefined

    fetchRoutes = [
      {
        matcher: ({ url }) => url.pathname === '/api/proxy/manga/101',
        response: () =>
          new Promise<Response>((resolve) => {
            resolveManga101 = () => {
              resolve(jsonResponse({ id: 101, title: 'Manga 101', images: [] }))
            }
          }),
      },
    ]
    fetchController = installMockFetch(() => fetchRoutes)

    const queryClient = createTestQueryClient()
    const { unmount } = renderHook(() => useMangaListCachedQuery({ mangaIds: [101] }), {
      wrapper: createTestQueryClientWrapper(queryClient),
    })

    await waitFor(() => {
      expect(fetchController?.calls).toHaveLength(1)
    })

    unmount()

    await waitFor(() => {
      expect(resolveManga101).toBeDefined()
    })

    resolveManga101?.()

    await waitFor(() => {
      expect(queryClient.getQueryData<{ id: number; title: string; images: unknown[] }>(['manga', 101])).toEqual({
        id: 101,
        title: 'Manga 101',
        images: [],
      })
    })
  })

  test('다른 URL page로 이동해도 이전 작품 요청은 완료되고 나중에 재사용된다', async () => {
    let resolveManga101: (() => void) | undefined

    fetchRoutes = [
      {
        matcher: ({ url }) => url.pathname === '/api/proxy/manga/101',
        response: () =>
          new Promise<Response>((resolve) => {
            resolveManga101 = () => {
              resolve(jsonResponse({ id: 101, title: 'Manga 101', images: [] }))
            }
          }),
      },
      {
        matcher: ({ url }) => url.pathname === '/api/proxy/manga/202',
        response: () => jsonResponse({ id: 202, title: 'Manga 202', images: [] }),
      },
    ]
    fetchController = installMockFetch(() => fetchRoutes)

    const view = renderWithTestQueryClient(<MangaTitleList mangaIds={[101]} />)

    expect(view.getByText('불러오는 중')).toBeTruthy()

    await waitFor(() => {
      const manga101Calls = fetchController?.calls.filter(({ url }) => url.pathname === '/api/proxy/manga/101') ?? []
      expect(manga101Calls).toHaveLength(1)
    })

    view.rerender(<MangaTitleList mangaIds={[202]} />)

    await waitFor(() => {
      expect(view.getByText('Manga 202')).toBeTruthy()
    })

    await waitFor(() => {
      expect(resolveManga101).toBeDefined()
    })

    resolveManga101?.()

    await waitFor(() => {
      expect(view.queryByText('Manga 101')).toBeNull()
    })

    const manga101CallsBeforeBack =
      fetchController?.calls.filter(({ url }) => url.pathname === '/api/proxy/manga/101').length ?? 0

    view.rerender(<MangaTitleList mangaIds={[101]} />)

    await waitFor(() => {
      expect(view.getByText('Manga 101')).toBeTruthy()
    })

    const manga101CallsAfterBack =
      fetchController?.calls.filter(({ url }) => url.pathname === '/api/proxy/manga/101').length ?? 0

    expect(manga101CallsBeforeBack).toBe(1)
    expect(manga101CallsAfterBack).toBe(1)
  })

  test('같은 key를 구독하는 중복 observer는 같은 fetch를 공유한다', async () => {
    function Both() {
      const first = useMangaListCachedQuery({ mangaIds: [101] })
      const second = useMangaListCachedQuery({ mangaIds: [101] })

      return <div>{String(Boolean(first.mangaMap.get(101))) + String(Boolean(second.mangaMap.get(101)))}</div>
    }

    fetchRoutes = [
      {
        matcher: ({ url }) => url.pathname === '/api/proxy/manga/101',
        response: () => jsonResponse({ id: 101, title: 'Manga 101', images: [] }),
      },
    ]
    fetchController = installMockFetch(() => fetchRoutes)

    const view = renderWithTestQueryClient(<Both />)

    await waitFor(() => {
      expect(view.getByText('truetrue')).toBeTruthy()
    })

    const manga101Calls = fetchController?.calls.filter(({ url }) => url.pathname === '/api/proxy/manga/101') ?? []

    expect(manga101Calls).toHaveLength(1)
  })

  test('단건 화면과 다건 화면은 같은 캐시를 추가 요청 없이 재사용한다', async () => {
    fetchRoutes = [
      {
        matcher: ({ url }) => url.pathname === '/api/proxy/manga/101',
        response: () => jsonResponse({ id: 101, title: 'Manga 101', images: [] }),
      },
    ]
    fetchController = installMockFetch(() => fetchRoutes)

    const view = renderWithTestQueryClient(<MangaTitleList mangaIds={[101]} />)

    await waitFor(() => {
      expect(view.getByText('Manga 101')).toBeTruthy()
    })

    const afterListCalls = fetchController?.calls.filter(({ url }) => url.pathname === '/api/proxy/manga/101').length ?? 0

    view.rerender(<SingleMangaTitle mangaId={101} />)

    await waitFor(() => {
      expect(view.getByText('Manga 101')).toBeTruthy()
    })

    const afterSingleCalls = fetchController?.calls.filter(({ url }) => url.pathname === '/api/proxy/manga/101').length ?? 0

    view.rerender(<MangaTitleList mangaIds={[101]} />)

    await waitFor(() => {
      expect(view.getByText('Manga 101')).toBeTruthy()
    })

    const afterListAgainCalls = fetchController?.calls.filter(({ url }) => url.pathname === '/api/proxy/manga/101').length ?? 0

    expect(afterListCalls).toBe(1)
    expect(afterSingleCalls).toBe(1)
    expect(afterListAgainCalls).toBe(1)
  })

  test('리스트 fallback은 데이터를 기다리는 동안 그대로 유지된다', async () => {
    let resolveManga303: (() => void) | undefined

    fetchRoutes = [
      {
        matcher: ({ url }) => url.pathname === '/api/proxy/manga/303',
        response: () =>
          new Promise<Response>((resolve) => {
            resolveManga303 = () => {
              resolve(jsonResponse({ id: 303, title: 'Manga 303', images: [] }))
            }
          }),
      },
    ]
    fetchController = installMockFetch(() => fetchRoutes)

    const view = renderWithTestQueryClient(<MangaTitleList mangaIds={[303]} />)

    expect(view.getByText('불러오는 중')).toBeTruthy()

    await waitFor(() => {
      expect(resolveManga303).toBeDefined()
    })

    resolveManga303?.()

    await waitFor(() => {
      expect(view.getByText('Manga 303')).toBeTruthy()
    })
  })
})
