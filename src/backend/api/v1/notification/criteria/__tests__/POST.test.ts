import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { Hono } from 'hono'
import { contextStorage } from 'hono/context-storage'

import type { Env } from '@/backend'
import type { ProblemDetails, ValidationProblemDetails } from '@/utils/problem-details'

import { MAX_CRITERIA_PER_USER, MAX_NOTIFICATION_CRITERIA_CONDITIONS } from '@/constants/policy'

type ExistingCriteriaRow = {
  conditionIsExcluded: boolean
  conditionType: number
  conditionValue: string
  criteriaId: number
  criteriaName: string
}

type NotificationRoutesModule = typeof import('../../')

type Scenario = {
  createdAt: Date
  existingCount: number
  existingCriteriaRows: ExistingCriteriaRow[]
  transactionError: Error | null
}

type TestEnv = Env & {
  Bindings: {
    isAdult?: boolean
    userId?: number
  }
}

let insertedConditionValues: unknown[] | null = null
let insertedCriteriaValues: Record<string, unknown> | null = null
let notificationRoutes: NotificationRoutesModule['default']
let scenario: Scenario

afterAll(() => {
  mock.restore()
})

mock.module('@/database/supabase/drizzle', () => ({
  db: {
    transaction: async (callback: (tx: ReturnType<typeof createTransactionMock>) => Promise<unknown>) => {
      if (scenario.transactionError) {
        throw scenario.transactionError
      }

      insertedCriteriaValues = null
      insertedConditionValues = null

      return callback(createTransactionMock())
    },
  },
}))

beforeAll(async () => {
  spyOn(console, 'error').mockImplementation(() => {})
  notificationRoutes = (await import('../../')).default
})

beforeEach(() => {
  scenario = {
    existingCount: 0,
    existingCriteriaRows: [],
    createdAt: new Date('2026-03-22T00:00:00.000Z'),
    transactionError: null,
  }
  insertedCriteriaValues = null
  insertedConditionValues = null
})

function createApp() {
  const app = new Hono<TestEnv>()

  app.use('*', contextStorage())
  app.use('*', async (c, next) => {
    if (c.env?.userId) {
      c.set('userId', c.env.userId)
      c.set('isAdult', c.env.isAdult ?? true)
    }

    await next()
  })
  app.route('/', notificationRoutes)

  return app
}

function createTransactionMock() {
  let insertCallCount = 0
  let selectCallCount = 0

  return {
    select: () => {
      const currentCall = ++selectCallCount

      if (currentCall === 1) {
        return {
          from: () => ({
            where: () => ({
              for: () => Promise.resolve([{ id: 1 }]),
            }),
          }),
        }
      }

      if (currentCall === 2) {
        return {
          from: () => ({
            where: () => Promise.resolve([{ count: scenario.existingCount }]),
          }),
        }
      }

      if (currentCall === 3) {
        return {
          from: () => ({
            innerJoin: () => ({
              where: () => Promise.resolve(scenario.existingCriteriaRows),
            }),
          }),
        }
      }

      throw new Error(`Unexpected select call: ${currentCall}`)
    },
    insert: () => {
      const currentCall = ++insertCallCount

      if (currentCall === 1) {
        return {
          values: (values: Record<string, unknown>) => {
            insertedCriteriaValues = values

            return {
              returning: () =>
                Promise.resolve([
                  {
                    id: 101,
                    createdAt: scenario.createdAt,
                    isActive: values.isActive,
                    name: values.name,
                  },
                ]),
            }
          },
        }
      }

      if (currentCall === 2) {
        return {
          values: (values: unknown[]) => {
            insertedConditionValues = values
            return Promise.resolve(values)
          },
        }
      }

      throw new Error(`Unexpected insert call: ${currentCall}`)
    },
  }
}

function requestCreateCriteria(body: unknown, env?: { isAdult?: boolean; userId?: number }) {
  return createApp().request(
    '/criteria',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    env ?? {},
  )
}

describe('POST /api/v1/notification/criteria', () => {
  test.serial('userId가 없으면 401 에러를 반환한다', async () => {
    const response = await requestCreateCriteria({
      name: 'artist alert',
      conditions: [{ type: 4, value: 'john_doe' }],
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('content-type')).toContain('application/problem+json')
  })

  test.serial('body가 비어 있으면 400 invalidParams 를 반환한다', async () => {
    const response = await requestCreateCriteria({}, { userId: 1 })

    expect(response.status).toBe(400)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.type).toBe('https://localhost/problems/invalid-input')
    expect(problem.invalidParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'name' }),
        expect.objectContaining({ name: 'conditions' }),
      ]),
    )
  })

  test.serial('최대 조건 수를 초과하면 400 을 반환한다', async () => {
    const response = await requestCreateCriteria(
      {
        name: 'too many',
        conditions: Array.from({ length: MAX_NOTIFICATION_CRITERIA_CONDITIONS + 1 }, (_, index) => ({
          type: 3,
          value: `tag_${index}`,
        })),
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.invalidParams).toContainEqual({
      name: 'conditions',
      reason: `최대 ${MAX_NOTIFICATION_CRITERIA_CONDITIONS}개 조건까지 추가할 수 있어요`,
    })
  })

  test.serial('허용되지 않은 조건 타입을 보내면 400 을 반환한다', async () => {
    const response = await requestCreateCriteria(
      {
        name: 'invalid type',
        conditions: [{ type: 8, value: 'bad_type' }],
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.invalidParams).toContainEqual({
      name: 'conditions[0].type',
      reason: '올바른 조건 타입을 선택해 주세요',
    })
  })

  test.serial('같은 조건을 중복해서 보내면 400 을 반환한다', async () => {
    const response = await requestCreateCriteria(
      {
        name: 'duplicate',
        conditions: [
          { type: 3, value: 'big breasts' },
          { type: 3, value: 'big_breasts' },
        ],
      },
      { userId: 1 },
    )

    expect(response.status).toBe(400)

    const problem = (await response.json()) as ValidationProblemDetails
    expect(problem.invalidParams).toContainEqual({
      name: 'conditions[1].value',
      reason: '같은 조건은 한 번만 추가할 수 있어요',
    })
  })

  test.serial('사용자 criteria 제한에 도달하면 403 을 반환한다', async () => {
    scenario.existingCount = MAX_CRITERIA_PER_USER

    const response = await requestCreateCriteria(
      {
        name: 'limit',
        conditions: [{ type: 4, value: 'john_doe' }],
      },
      { userId: 1 },
    )

    expect(response.status).toBe(403)

    const problem = (await response.json()) as ProblemDetails
    expect(problem.type).toBe('https://localhost/problems/notification-criteria-limit-reached')
    expect(problem.detail).toBe(`최대 ${MAX_CRITERIA_PER_USER}개까지만 추가할 수 있어요`)
    expect(insertedCriteriaValues).toBeNull()
  })

  test.serial('동일한 조건의 criteria 가 이미 있으면 409 와 extension 을 반환한다', async () => {
    scenario.existingCount = 1
    scenario.existingCriteriaRows = [
      {
        criteriaId: 55,
        criteriaName: '존 도 알림',
        conditionType: 4,
        conditionValue: 'john_doe',
        conditionIsExcluded: false,
      },
    ]

    const response = await requestCreateCriteria(
      {
        name: 'artist alert',
        conditions: [{ type: 4, value: 'john_doe' }],
      },
      { userId: 1 },
    )

    expect(response.status).toBe(409)

    const problem = (await response.json()) as ProblemDetails
    expect(problem.type).toBe('https://localhost/problems/notification-criteria-conflict')
    expect(problem.detail).toBe('이미 동일한 키워드 알림이 존재해요: 존 도 알림')
    expect(problem.existingCriteriaId).toBe(55)
    expect(problem.existingCriteriaName).toBe('존 도 알림')
    expect(insertedCriteriaValues).toBeNull()
  })

  test.serial('criteria 생성도 성인 인증이 없으면 403 을 반환한다', async () => {
    const response = await requestCreateCriteria(
      {
        name: 'Artist Alert',
        conditions: [
          { type: 4, value: ' John Doe ' },
          { type: 7, value: 'Uploader Name' },
        ],
      },
      { userId: 1, isAdult: false },
    )

    expect(response.status).toBe(403)

    const problem = (await response.json()) as ProblemDetails
    expect(problem.type).toBe('https://localhost/problems/adult-verification-required')
    expect(insertedCriteriaValues).toBeNull()
    expect(insertedConditionValues).toBeNull()
  })

  test.serial('기존 notification 라우트는 계속 성인 인증을 요구한다', async () => {
    const response = await createApp().request('/unread-count', {}, { userId: 1, isAdult: false })

    expect(response.status).toBe(403)

    const problem = (await response.json()) as ProblemDetails
    expect(problem.type).toBe('https://localhost/problems/adult-verification-required')
  })

  test.serial('트랜잭션 오류가 발생하면 500 을 반환한다', async () => {
    scenario.transactionError = new Error('db failed')

    const response = await requestCreateCriteria(
      {
        name: 'error',
        conditions: [{ type: 4, value: 'john_doe' }],
      },
      { userId: 1 },
    )

    expect(response.status).toBe(500)

    const problem = (await response.json()) as ProblemDetails
    expect(problem.detail).toBe('키워드 알림 설정에 실패했어요')
  })
})
