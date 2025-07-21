'use server'

import { inArray, sql } from 'drizzle-orm'
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
    const results = await db
      .insert(userCensorshipTable)
      .values(censorships)
      .onConflictDoNothing()
      .returning({ id: userCensorshipTable.id })

    if (results.length === 0) {
      return { status: 204 }
    }

    return {
      status: 200,
      data: { ids: results.map((r) => r.id) },
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
      .where(sql`${userCensorshipTable.id} = ANY(${ids}) AND ${userCensorshipTable.userId} = ${userId}`)
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
