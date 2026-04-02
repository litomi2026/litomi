import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'

import meRoutes from '../me/index'

let fallbackAutoDeletionDay = 365
let currentSettingRow:
  | {
      historySyncEnabled: boolean
      adultVerifiedAdVisible: boolean
      autoDeletionDay: number
    }
  | undefined
let shouldThrowDatabaseError = false

beforeAll(() => {
  spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  mock.restore()
})

beforeEach(() => {
  fallbackAutoDeletionDay = 365
  currentSettingRow = undefined
  shouldThrowDatabaseError = false
})

type TestEnv = Env & {
  Bindings: {
    userId?: number
  }
}

const app = new Hono<TestEnv>()
app.use('*', contextStorage())
app.use('*', async (c, next) => {
  if (c.env.userId) {
    c.set('userId', c.env.userId)
  }
  await next()
})
app.route('/', meRoutes)

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => {
            if (shouldThrowDatabaseError) {
              return Promise.reject(new Error('Database connection failed'))
            }

            return Promise.resolve([
              {
                historySyncEnabled: currentSettingRow?.historySyncEnabled ?? null,
                adultVerifiedAdVisible: currentSettingRow?.adultVerifiedAdVisible ?? null,
                autoDeletionDay: currentSettingRow?.autoDeletionDay ?? null,
                fallbackAutoDeletionDay,
              },
            ])
          },
        }),
      }),
    }),
    insert: () => ({
      values: (values: {
        historySyncEnabled: boolean
        adultVerifiedAdVisible: boolean
        autoDeletionDay: number
      }) => ({
        onConflictDoUpdate: ({ set }: { set: Partial<typeof values> }) => {
          if (shouldThrowDatabaseError) {
            return Promise.reject(new Error('Database connection failed'))
          }

          if (!currentSettingRow) {
            currentSettingRow = {
              historySyncEnabled: values.historySyncEnabled,
              adultVerifiedAdVisible: values.adultVerifiedAdVisible,
              autoDeletionDay: values.autoDeletionDay,
            }
          } else {
            currentSettingRow = {
              historySyncEnabled: set.historySyncEnabled ?? currentSettingRow.historySyncEnabled,
              adultVerifiedAdVisible: set.adultVerifiedAdVisible ?? currentSettingRow.adultVerifiedAdVisible,
              autoDeletionDay: set.autoDeletionDay ?? currentSettingRow.autoDeletionDay,
            }
          }

          return Promise.resolve()
        },
      }),
    }),
  },
}))

describe('PATCH /api/v1/me/settings', () => {
  test('row가 없어도 fallback 값을 유지한 채 partial patch를 저장한다', async () => {
    const response = await app.request(
      '/settings',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historySyncEnabled: false }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(204)
    expect(currentSettingRow).toEqual({
      historySyncEnabled: false,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 365,
    })
  })

  test('기존 row가 있으면 요청한 필드만 바꾸고 나머지는 유지한다', async () => {
    currentSettingRow = {
      historySyncEnabled: false,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 365,
    }

    const response = await app.request(
      '/settings',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adultVerifiedAdVisible: true }),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(204)
    expect(currentSettingRow).toEqual({
      historySyncEnabled: false,
      adultVerifiedAdVisible: true,
      autoDeletionDay: 365,
    })
  })

  test('빈 body는 400을 반환한다', async () => {
    const response = await app.request(
      '/settings',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)
  })

  test('인증이 없으면 401을 반환한다', async () => {
    const response = await app.request(
      '/settings',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historySyncEnabled: false }),
      },
      {},
    )

    expect(response.status).toBe(401)
  })
})
