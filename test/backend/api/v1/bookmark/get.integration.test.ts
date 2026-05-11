import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmarks, seedUser } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, test } from 'bun:test'

import { privateCacheControl } from '@/backend/utils/cache-control'

import { createBookmarkAuthContext } from './fixtures'

installBackendIntegrationHooks()

describe('GET /api/v1/bookmark', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({ path: '/api/v1/bookmark' })

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/bookmark',
    })
  })

  test('성인인증이 안 된 한국 사용자는 403을 반환한다', async () => {
    const { auth } = await createBookmarkAuthContext({ adult: false })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      cookies: auth.cookieHeader,
      headers: { 'CF-IPCountry': 'KR' },
    })

    await expectProblemResponse(response, {
      status: 403,
      code: 'adult-verification-required',
      detail: '성인인증이 필요해요',
      instance: '/api/v1/bookmark',
    })

    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)
  })

  test('잘못된 cursor를 전달하면 400을 반환한다', async () => {
    const { auth } = await createBookmarkAuthContext()

    const response = await requestBackend({
      path: '/api/v1/bookmark?cursor=invalid-cursor',
      cookies: auth.cookieHeader,
    })

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      instance: '/api/v1/bookmark?cursor=invalid-cursor',
    })
  })

  test('현재 사용자의 북마크만 created-desc 기준으로 안정적으로 페이지네이션한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const otherUser = await seedUser()
    const newest = new Date('2025-01-03T00:00:00.000Z')
    const older = new Date('2025-01-02T00:00:00.000Z')
    const oldest = new Date('2025-01-01T00:00:00.000Z')

    await seedBookmarks(user.id, [
      { mangaId: 300, createdAt: newest },
      { mangaId: 200, createdAt: newest },
      { mangaId: 150, createdAt: older },
      { mangaId: 100, createdAt: oldest },
    ])

    await seedBookmarks(otherUser.id, [
      { mangaId: 999, createdAt: new Date('2025-01-04T00:00:00.000Z') },
      { mangaId: 250, createdAt: newest },
    ])

    const firstResponse = await requestBackend({
      path: '/api/v1/bookmark?limit=2',
      cookies: auth.cookieHeader,
    })

    expect(firstResponse.status).toBe(200)
    expect(firstResponse.headers.get('Cache-Control')).toBe(privateCacheControl)

    const firstBody = await firstResponse.json()

    expect(firstBody).toEqual({
      bookmarks: [
        { mangaId: 300, createdAt: newest.getTime() },
        { mangaId: 200, createdAt: newest.getTime() },
      ],
      nextCursor: `${newest.getTime()}-200`,
    })

    const secondResponse = await requestBackend({
      path: `/api/v1/bookmark?limit=2&cursor=${firstBody.nextCursor}`,
      cookies: auth.cookieHeader,
    })

    expect(secondResponse.status).toBe(200)
    expect(secondResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(await secondResponse.json()).toEqual({
      bookmarks: [
        { mangaId: 150, createdAt: older.getTime() },
        { mangaId: 100, createdAt: oldest.getTime() },
      ],
      nextCursor: null,
    })
  })

  test('created-asc 정렬에서도 같은 생성 시각을 안정적으로 넘기며 페이지네이션한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const oldest = new Date('2025-01-01T00:00:00.000Z')
    const middle = new Date('2025-01-02T00:00:00.000Z')
    const newest = new Date('2025-01-03T00:00:00.000Z')

    await seedBookmarks(user.id, [
      { mangaId: 100, createdAt: oldest },
      { mangaId: 200, createdAt: middle },
      { mangaId: 150, createdAt: middle },
      { mangaId: 300, createdAt: newest },
    ])

    const firstResponse = await requestBackend({
      path: '/api/v1/bookmark?limit=2&sort=created-asc',
      cookies: auth.cookieHeader,
    })

    expect(firstResponse.status).toBe(200)
    expect(firstResponse.headers.get('Cache-Control')).toBe(privateCacheControl)

    const firstBody = await firstResponse.json()

    expect(firstBody).toEqual({
      bookmarks: [
        { mangaId: 100, createdAt: oldest.getTime() },
        { mangaId: 150, createdAt: middle.getTime() },
      ],
      nextCursor: `${middle.getTime()}-150`,
    })

    const secondResponse = await requestBackend({
      path: `/api/v1/bookmark?limit=2&sort=created-asc&cursor=${firstBody.nextCursor}`,
      cookies: auth.cookieHeader,
    })

    expect(secondResponse.status).toBe(200)
    expect(secondResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(await secondResponse.json()).toEqual({
      bookmarks: [
        { mangaId: 200, createdAt: middle.getTime() },
        { mangaId: 300, createdAt: newest.getTime() },
      ],
      nextCursor: null,
    })
  })

  test('manga-id-asc 정렬에서도 다음 커서로 이어서 조회한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const oldest = new Date('2025-01-01T00:00:00.000Z')
    const middle = new Date('2025-01-02T00:00:00.000Z')
    const newest = new Date('2025-01-03T00:00:00.000Z')

    await seedBookmarks(user.id, [
      { mangaId: 300, createdAt: newest },
      { mangaId: 100, createdAt: oldest },
      { mangaId: 200, createdAt: middle },
    ])

    const firstResponse = await requestBackend({
      path: '/api/v1/bookmark?limit=2&sort=manga-id-asc',
      cookies: auth.cookieHeader,
    })

    expect(firstResponse.status).toBe(200)
    expect(firstResponse.headers.get('Cache-Control')).toBe(privateCacheControl)

    const firstBody = await firstResponse.json()

    expect(firstBody).toEqual({
      bookmarks: [
        { mangaId: 100, createdAt: oldest.getTime() },
        { mangaId: 200, createdAt: middle.getTime() },
      ],
      nextCursor: `${middle.getTime()}-200`,
    })

    const secondResponse = await requestBackend({
      path: `/api/v1/bookmark?limit=2&sort=manga-id-asc&cursor=${firstBody.nextCursor}`,
      cookies: auth.cookieHeader,
    })

    expect(secondResponse.status).toBe(200)
    expect(secondResponse.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(await secondResponse.json()).toEqual({
      bookmarks: [{ mangaId: 300, createdAt: newest.getTime() }],
      nextCursor: null,
    })
  })
})
