import { describe, expect, test } from 'bun:test'
import { EXPANSION_TYPE } from '@litomi/domain/points/model'
import { problemCode } from '@litomi/http/problem-details'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmark, seedBookmarks, seedUser, seedUserExpansion } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { createBookmarkAuthContext, listBookmarksForUser } from './fixtures'

installBackendIntegrationHooks()

describe('POST /api/v1/bookmark', () => {
  test('mangaIds가 비어 있으면 400을 반환하고 저장하지 않는다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: { mangaIds: [] },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: '/api/v1/bookmark',
    })

    expectInvalidParams(problem, [{ name: 'mangaIds' }])
    expect(await listBookmarksForUser(user.id)).toEqual([])
  })

  test('현재 사용자의 기존 북마크만 duplicate로 계산하고 요청 중복은 한 번만 저장한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const otherUser = await seedUser()
    await seedBookmark(user.id, { mangaId: 101 })
    await seedBookmark(otherUser.id, { mangaId: 102 })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [101, 101, 102, 102, 103],
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      createdMangaIds: [102, 103],
      duplicateCount: 1,
      overflowCount: 0,
    })

    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([101, 102, 103])
    expect((await listBookmarksForUser(otherUser.id)).map(({ mangaId }) => mangaId)).toEqual([102])
  })

  test('남은 슬롯보다 많이 요청하면 저장 가능한 만큼만 만들고 overflowCount를 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    await seedBookmarks(
      user.id,
      Array.from({ length: 499 }, (_, index) => ({
        mangaId: index + 1,
      })),
    )

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [9001, 9002],
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      createdMangaIds: [9001],
      duplicateCount: 0,
      overflowCount: 1,
    })

    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toContain(9001)
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).not.toContain(9002)
  })

  test('북마크 확장분이 있으면 기본 한도를 넘겨도 저장한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    await seedBookmarks(
      user.id,
      Array.from({ length: 500 }, (_, index) => ({
        mangaId: index + 1,
      })),
    )
    await seedUserExpansion({
      userId: user.id,
      type: EXPANSION_TYPE.BOOKMARK,
      amount: 100,
    })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [9001, 9002],
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      createdMangaIds: [9001, 9002],
      duplicateCount: 0,
      overflowCount: 0,
    })

    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual(
      expect.arrayContaining([9001, 9002]),
    )
  })

  test('mangaIds가 101개면 400 invalid-input을 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: Array.from({ length: 101 }, (_, index) => index + 1),
      },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: '/api/v1/bookmark',
    })

    expectInvalidParams(problem, [{ name: 'mangaIds' }])
    expect(await listBookmarksForUser(user.id)).toEqual([])
  })

  test('이미 한도에 도달했고 확장도 없으면 403을 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    await seedBookmarks(
      user.id,
      Array.from({ length: 500 }, (_, index) => ({
        mangaId: index + 1,
      })),
    )

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [9999],
      },
    })

    await expectProblemResponse(response, {
      status: 403,
      code: problemCode.LIBO_EXPANSION_REQUIRED,
      detail: '북마크 저장 한도에 도달했어요',
      instance: '/api/v1/bookmark',
    })

    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).not.toContain(9999)
  })
})
