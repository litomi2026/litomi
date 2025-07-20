import { and, desc, or, SQL, sql } from 'drizzle-orm'

import { db } from '@/database/drizzle'
import { userCensorshipTable } from '@/database/schema'

export type CensorshipRow = {
  id: number
  key: number
  value: string
  level: number
  createdAt: Date
}

type Params = {
  userId: number | string
  limit?: number
  cursorId?: string
  cursorTime?: string
}

export default async function selectCensorships({
  userId,
  limit,
  cursorId,
  cursorTime,
}: Params): Promise<CensorshipRow[]> {
  const conditions: (SQL | undefined)[] = [sql`${userCensorshipTable.userId} = ${userId}`]

  if (cursorId && cursorTime) {
    conditions.push(
      or(
        sql`${userCensorshipTable.createdAt} < ${cursorTime}`,
        and(sql`${userCensorshipTable.createdAt} = ${cursorTime}`, sql`${userCensorshipTable.id} < ${cursorId}`),
      ),
    )
  } else if (cursorTime) {
    conditions.push(sql`${userCensorshipTable.createdAt} < ${cursorTime}`)
  }

  const query = db
    .select({
      id: userCensorshipTable.id,
      key: userCensorshipTable.key,
      value: userCensorshipTable.value,
      level: userCensorshipTable.level,
      createdAt: userCensorshipTable.createdAt,
    })
    .from(userCensorshipTable)
    .where(and(...conditions))
    .orderBy(desc(userCensorshipTable.createdAt), desc(userCensorshipTable.id))

  if (limit) {
    query.limit(limit)
  }

  return query
}
