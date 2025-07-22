'use server'

import { and, inArray, sql } from 'drizzle-orm'
import { cookies } from 'next/headers'

import { db } from '@/database/drizzle'
import { userCensorshipTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

import { addCensorshipsSchema, deleteCensorshipsSchema, updateCensorshipsSchema } from './schema'

export async function addCensorships(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userIdFromToken = await getUserIdFromAccessToken(cookieStore)

  if (!userIdFromToken) {
    return { status: 401, message: '로그인 정보가 없거나 만료됐어요' }
  }

  const validation = addCensorshipsSchema.safeParse({
    keys: formData.getAll('key').map((key) => Number(key)),
    values: formData.getAll('value'),
    levels: formData.getAll('level').map((level) => Number(level)),
    userId: userIdFromToken,
  })

  if (!validation.success) {
    return { status: 400, message: validation.error.issues[0].message }
  }

  const { keys, values, levels, userId } = validation.data

  const censorships = keys.map((key, index) => ({
    userId,
    key,
    value: values[index],
    level: levels[index],
  }))

  try {
    const { insertResults, exceeded, message, status } = await db.transaction(async (tx) => {
      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(userCensorshipTable)
        .where(sql`${userCensorshipTable.userId} = ${userId}`)

      if (count + censorships.length > 100) {
        return {
          status: 400,
          message: `검열 규칙은 최대 100개까지만 추가할 수 있어요. (현재 ${count}개)`,
          exceeded: true,
        }
      }

      const insertResults = await tx
        .insert(userCensorshipTable)
        .values(censorships)
        .returning({ id: userCensorshipTable.id })

      return { insertResults }
    })

    if (exceeded) {
      return { status, message }
    }

    if (!insertResults || insertResults.length === 0) {
      return { status: 204 }
    }

    return {
      status: 200,
      data: { ids: insertResults.map((r) => r.id) },
    }
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'value too long', 'duplicate key'].some((message) => error.message.includes(message))) {
        return { status: 400, message: '입력을 확인해주세요' }
      }
    }
    return { status: 500, message: '오류가 발생했어요' }
  }
}

export async function deleteCensorships(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userIdFromToken = await getUserIdFromAccessToken(cookieStore)

  if (!userIdFromToken) {
    return { status: 401, message: '로그인 정보가 없거나 만료됐어요' }
  }

  const validation = deleteCensorshipsSchema.safeParse({
    ids: formData.getAll('id'),
    userId: userIdFromToken,
  })

  if (!validation.success) {
    return { status: 400, message: validation.error.issues[0].message }
  }

  try {
    const result = await db
      .delete(userCensorshipTable)
      .where(inArray(userCensorshipTable.id, validation.data.ids))
      .returning({ deletedIds: userCensorshipTable.id })

    if (result.length === 0) {
      return { status: 204 }
    }

    return {
      status: 200,
      data: { deletedIds: result.map((r) => r.deletedIds) },
    }
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'constraint'].some((message) => error.message.includes(message))) {
        return { status: 400, message: '입력을 확인해주세요' }
      }
    }
    return { status: 500, message: '오류가 발생했어요' }
  }
}

export async function updateCensorships(_prevState: unknown, formData: FormData) {
  const cookieStore = await cookies()
  const userIdFromToken = await getUserIdFromAccessToken(cookieStore)

  if (!userIdFromToken) {
    return { status: 401, message: '로그인 정보가 없거나 만료됐어요' }
  }

  const validation = updateCensorshipsSchema.safeParse({
    ids: formData.getAll('id'),
    keys: formData.getAll('key').map((key) => Number(key)),
    values: formData.getAll('value'),
    levels: formData.getAll('level').map((level) => Number(level)),
    userId: userIdFromToken,
  })

  if (!validation.success) {
    return { status: 400, message: validation.error.issues[0].message }
  }

  const { ids, keys, values, levels, userId } = validation.data

  try {
    const keyCase = sql.join(
      [
        sql`CASE`,
        ...ids.map((id, index) => sql`WHEN ${userCensorshipTable.id} = ${id} THEN ${keys[index]}`),
        sql`ELSE ${userCensorshipTable.key} END`,
      ],
      sql.raw(' '),
    )

    const valueCase = sql.join(
      [
        sql`CASE`,
        ...ids.map((id, index) => sql`WHEN ${userCensorshipTable.id} = ${id} THEN ${values[index]}`),
        sql`ELSE ${userCensorshipTable.value} END`,
      ],
      sql.raw(' '),
    )

    const levelCase = sql.join(
      [
        sql`CASE`,
        ...ids.map((id, index) => sql`WHEN ${userCensorshipTable.id} = ${id} THEN ${levels[index]}`),
        sql`ELSE ${userCensorshipTable.level} END`,
      ],
      sql.raw(' '),
    )

    const result = await db
      .update(userCensorshipTable)
      .set({
        key: keyCase,
        value: valueCase,
        level: levelCase,
      })
      .where(and(inArray(userCensorshipTable.id, ids), sql`${userCensorshipTable.userId} = ${userId}`))
      .returning({ id: userCensorshipTable.id })

    if (result.length === 0) {
      return { status: 204 }
    }

    return {
      status: 200,
      data: { updatedIds: result.map((r) => r.id) },
    }
  } catch (error) {
    if (error instanceof Error) {
      if (['foreign key', 'constraint', 'invalid input'].some((message) => error.message.includes(message))) {
        return { status: 400, message: '입력을 확인해주세요' }
      }
    }
    return { status: 500, message: '오류가 발생했어요' }
  }
}
