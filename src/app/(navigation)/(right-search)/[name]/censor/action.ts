'use server'

import { captureException } from '@sentry/nextjs'
import { count, inArray, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { db, sessionDB } from '@/database/drizzle'
import { userCensorshipTable } from '@/database/schema'
import { badRequest, internalServerError, noContent, ok, unauthorized } from '@/utils/action-response'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { flattenZodFieldErrors } from '@/utils/form-error'

import { addCensorshipsSchema, deleteCensorshipsSchema, updateCensorshipsSchema } from './schema'

export async function addCensorships(formData: FormData) {
  const cookieStore = await cookies()
  const userIdFromToken = await getUserIdFromAccessToken(cookieStore)

  if (!userIdFromToken) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = addCensorshipsSchema.safeParse({
    keys: formData.getAll('key').map((key) => Number(key)),
    values: formData.getAll('value'),
    levels: formData.getAll('level').map((level) => Number(level)),
    userId: userIdFromToken,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { keys, values, levels, userId } = validation.data

  const censorships = keys.map((key, index) => ({
    userId,
    key,
    value: values[index],
    level: levels[index],
  }))

  try {
    const result = await sessionDB.transaction(async (tx) => {
      const [{ censorshipCount }] = await tx
        .select({ censorshipCount: count() })
        .from(userCensorshipTable)
        .where(sql`${userCensorshipTable.userId} = ${userId}`)

      if (censorshipCount + censorships.length > 100) {
        return badRequest(`검열 규칙은 최대 100개까지만 추가할 수 있어요. (현재 ${censorshipCount}개)`, formData)
      }

      const insertedCensorships = await tx
        .insert(userCensorshipTable)
        .values(censorships)
        .returning({ id: userCensorshipTable.id })

      return insertedCensorships.map((r) => r.id)
    })

    if ('error' in result) {
      return result
    }

    if (result.length === 0) {
      return noContent()
    }

    return ok(result)
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'value too long', 'duplicate key'].some((message) => error.message.includes(message))) {
        return badRequest('입력을 확인해주세요', formData)
      }
    }

    captureException(error, { extra: { name: 'addCensorships' } })
    return internalServerError('오류가 발생했어요', formData)
  }
}

export async function deleteCensorships(formData: FormData) {
  const cookieStore = await cookies()
  const userIdFromToken = await getUserIdFromAccessToken(cookieStore)

  if (!userIdFromToken) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = deleteCensorshipsSchema.safeParse({
    ids: formData.getAll('id'),
    userId: userIdFromToken,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  try {
    const result = await db
      .delete(userCensorshipTable)
      .where(inArray(userCensorshipTable.id, validation.data.ids))
      .returning({ deletedIds: userCensorshipTable.id })

    if (result.length === 0) {
      return noContent()
    }

    return ok(result.map((r) => r.deletedIds))
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'constraint'].some((message) => error.message.includes(message))) {
        return badRequest('입력을 확인해주세요', formData)
      }
    }

    captureException(error, { extra: { name: 'deleteCensorships' } })
    return internalServerError('오류가 발생했어요', formData)
  }
}

export async function updateCensorships(formData: FormData) {
  const cookieStore = await cookies()
  const userIdFromToken = await getUserIdFromAccessToken(cookieStore)

  if (!userIdFromToken) {
    return unauthorized('로그인 정보가 없거나 만료됐어요', formData)
  }

  const validation = updateCensorshipsSchema.safeParse({
    ids: formData.getAll('id'),
    keys: formData.getAll('key').map((key) => Number(key)),
    values: formData.getAll('value'),
    levels: formData.getAll('level').map((level) => Number(level)),
    userId: userIdFromToken,
  })

  if (!validation.success) {
    return badRequest(flattenZodFieldErrors(validation.error), formData)
  }

  const { ids, keys, values, levels, userId } = validation.data

  const updateData = ids.map((id, index) => ({
    id,
    key: keys[index],
    value: values[index],
    level: levels[index],
    userId,
  }))

  try {
    const result = await db
      .insert(userCensorshipTable)
      .values(updateData)
      .onConflictDoUpdate({
        target: userCensorshipTable.id,
        set: {
          key: sql.raw(`excluded.${userCensorshipTable.key.name}`),
          value: sql.raw(`excluded.${userCensorshipTable.value.name}`),
          level: sql.raw(`excluded.${userCensorshipTable.level.name}`),
        },
        setWhere: sql`${userCensorshipTable.userId} = ${userId}`,
      })
      .returning({ id: userCensorshipTable.id })

    if (result.length === 0) {
      return noContent()
    }

    return ok(result.map((r) => r.id))
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'constraint', 'invalid input'].some((message) => error.message.includes(message))) {
        return badRequest('입력을 확인해주세요', formData)
      }
    }

    captureException(error, { extra: { name: 'updateCensorships', userId } })
    return internalServerError('업데이트 도중 오류가 발생했어요', formData)
  }
}
