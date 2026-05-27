import { db } from '@litomi/db/app'
import { bookmarkTable, readingHistoryTable, userRatingTable } from '@litomi/db/app/activity'
import { userCensorshipTable } from '@litomi/db/app/censorship'
import { libraryItemTable, libraryTable } from '@litomi/db/app/library'
import { mangaRecommendationSetTable, mangaRecommendationTable } from '@litomi/db/app/recommendation'
import { type CensorshipKey, CensorshipLevel } from '@litomi/domain/censorship/model'
import { and, eq, sql, type SQL } from 'drizzle-orm'

import type { CensorshipRule } from './censorship'
import type {
  Candidate,
  CandidateRow,
  MangaRecommendation,
  PreferenceSignal,
  SelectActiveUserOptions,
  Signal,
  SignalSentiment,
} from './types'

const ADVISORY_LOCK_NAMESPACE = 20260526
const HISTORY_SIGNAL_LIMIT = 500
const BOOKMARK_SIGNAL_LIMIT = 500
const RATING_SIGNAL_LIMIT = 500
const LIBRARY_SIGNAL_LIMIT = 500
const TOTAL_SIGNAL_LIMIT = 800
const NEIGHBOR_USER_LIMIT = 300

type ActiveUserRow = {
  userId: number | string
}

type MangaIdRow = {
  mangaId: number | string
}

type RawCandidateRow = {
  mangaId: number | string
  score: number | string
  reasons: string[] | null
}

type SignalRow = {
  mangaId: number | string
  sentiment: string
  weight: number | string
}

export function mergeCandidateRows(candidates: Map<number, Candidate>, rows: CandidateRow[]) {
  for (const row of rows) {
    const existing = candidates.get(row.mangaId)

    if (existing) {
      existing.score += row.score

      for (const reason of row.reasons ?? []) {
        existing.reasons.add(reason)
      }

      continue
    }

    candidates.set(row.mangaId, {
      mangaId: row.mangaId,
      reasons: new Set(row.reasons ?? []),
      score: row.score,
    })
  }
}

export async function replaceMangaRecommendationSet(userId: number, items: MangaRecommendation[]) {
  const generatedAt = new Date()

  await db.transaction(async (tx) => {
    const [lock] = await tx.execute<{ locked: boolean }>(
      sql`select pg_try_advisory_xact_lock(${ADVISORY_LOCK_NAMESPACE}, ${userId}) as "locked"`,
    )

    if (!lock?.locked) {
      return
    }

    await tx.insert(mangaRecommendationSetTable).values({ userId, generatedAt }).onConflictDoUpdate({
      target: mangaRecommendationSetTable.userId,
      set: { generatedAt },
    })

    await tx.delete(mangaRecommendationTable).where(eq(mangaRecommendationTable.userId, userId))

    if (items.length === 0) {
      return
    }

    await tx.insert(mangaRecommendationTable).values(
      items.map((item) => ({
        userId,
        mangaId: item.mangaId,
        rank: item.rank,
        score: item.score,
        reasons: item.reasons,
      })),
    )
  })
}

export async function selectActiveUserIds(options: SelectActiveUserOptions = {}): Promise<number[]> {
  const activeDays = options.activeDays ?? 30
  const limit = options.limit ?? 5000

  const rows = await db.execute<ActiveUserRow>(sql`
    with active_users as (
      select
        ${readingHistoryTable.userId} as user_id,
        max(${readingHistoryTable.updatedAt}) as last_activity_at
      from ${readingHistoryTable}
      where ${readingHistoryTable.updatedAt} >= now() - (${activeDays}::int * interval '1 day')
      group by ${readingHistoryTable.userId}

      union all

      select
        ${bookmarkTable.userId} as user_id,
        max(${bookmarkTable.createdAt}) as last_activity_at
      from ${bookmarkTable}
      where ${bookmarkTable.createdAt} >= now() - (${activeDays}::int * interval '1 day')
      group by ${bookmarkTable.userId}

      union all

      select
        ${userRatingTable.userId} as user_id,
        max(${userRatingTable.updatedAt}) as last_activity_at
      from ${userRatingTable}
      where ${userRatingTable.updatedAt} >= now() - (${activeDays}::int * interval '1 day')
      group by ${userRatingTable.userId}

      union all

      select
        ${libraryTable.userId} as user_id,
        max(${libraryItemTable.createdAt}) as last_activity_at
      from ${libraryItemTable}
      inner join ${libraryTable} on ${libraryTable.id} = ${libraryItemTable.libraryId}
      where ${libraryItemTable.createdAt} >= now() - (${activeDays}::int * interval '1 day')
      group by ${libraryTable.userId}
    )
    select
      user_id as "userId"
    from active_users
    group by user_id
    order by max(last_activity_at) desc
    limit ${limit}
  `)

  return rows.map(({ userId }) => toSafeInteger(userId, 'userId'))
}

export async function selectCollaborativeCandidates(
  userId: number,
  signals: Signal[],
  limit: number,
): Promise<CandidateRow[]> {
  if (signals.length === 0) {
    return []
  }

  const rows = await db.execute<RawCandidateRow>(sql`
    with signal(manga_id, weight) as (
      values ${signalValues(signals)}
    ),
    weighted_signal as (
      select
        signal.manga_id,
        (
          signal.weight / ln(2.718281828 + greatest(count(${readingHistoryTable.userId})::double precision, 1.0))
        )::double precision as weight
      from signal
      left join ${readingHistoryTable} on ${readingHistoryTable.mangaId} = signal.manga_id
      group by signal.manga_id, signal.weight
    ),
    excluded(manga_id) as (
      select ${readingHistoryTable.mangaId} from ${readingHistoryTable} where ${readingHistoryTable.userId} = ${userId}
      union
      select ${bookmarkTable.mangaId} from ${bookmarkTable} where ${bookmarkTable.userId} = ${userId}
      union
      select ${userRatingTable.mangaId} from ${userRatingTable} where ${userRatingTable.userId} = ${userId}
      union
      select ${libraryItemTable.mangaId}
      from ${libraryItemTable}
      inner join ${libraryTable} on ${libraryTable.id} = ${libraryItemTable.libraryId}
      where ${libraryTable.userId} = ${userId}
    ),
    neighbor_users as (
      select
        ${readingHistoryTable.userId} as user_id,
        sum(weighted_signal.weight)::double precision as affinity
      from ${readingHistoryTable}
      inner join weighted_signal on weighted_signal.manga_id = ${readingHistoryTable.mangaId}
      where ${readingHistoryTable.userId} <> ${userId}
      group by ${readingHistoryTable.userId}
      order by affinity desc
      limit ${NEIGHBOR_USER_LIMIT}
    ),
    candidate_events as (
      select
        ${readingHistoryTable.mangaId} as manga_id,
        sum(neighbor_users.affinity)::double precision as score,
        'similar_readers'::text as reason
      from ${readingHistoryTable}
      inner join neighbor_users on neighbor_users.user_id = ${readingHistoryTable.userId}
      left join excluded on excluded.manga_id = ${readingHistoryTable.mangaId}
      where excluded.manga_id is null
      group by ${readingHistoryTable.mangaId}

      union all

      select
        ${bookmarkTable.mangaId} as manga_id,
        sum(neighbor_users.affinity * 1.8)::double precision as score,
        'similar_bookmarks'::text as reason
      from ${bookmarkTable}
      inner join neighbor_users on neighbor_users.user_id = ${bookmarkTable.userId}
      left join excluded on excluded.manga_id = ${bookmarkTable.mangaId}
      where excluded.manga_id is null
      group by ${bookmarkTable.mangaId}

      union all

      select
        ${userRatingTable.mangaId} as manga_id,
        sum(neighbor_users.affinity * ${userRatingTable.rating}::double precision * 0.45)::double precision as score,
        'similar_ratings'::text as reason
      from ${userRatingTable}
      inner join neighbor_users on neighbor_users.user_id = ${userRatingTable.userId}
      left join excluded on excluded.manga_id = ${userRatingTable.mangaId}
      where excluded.manga_id is null
        and ${userRatingTable.rating} >= 4
      group by ${userRatingTable.mangaId}

      union all

      select
        ${libraryItemTable.mangaId} as manga_id,
        sum(neighbor_users.affinity * 1.4)::double precision as score,
        'similar_libraries'::text as reason
      from ${libraryItemTable}
      inner join ${libraryTable} on ${libraryTable.id} = ${libraryItemTable.libraryId}
      inner join neighbor_users on neighbor_users.user_id = ${libraryTable.userId}
      left join excluded on excluded.manga_id = ${libraryItemTable.mangaId}
      where excluded.manga_id is null
      group by ${libraryItemTable.mangaId}
    )
    select
      manga_id as "mangaId",
      sum(score)::double precision as "score",
      array_agg(distinct reason)::text[] as "reasons"
    from candidate_events
    group by manga_id
    order by sum(score) desc
    limit ${limit}
  `)

  return normalizeCandidateRows(rows)
}

export async function selectUserCensorshipRules(userId: number, level: CensorshipLevel): Promise<CensorshipRule[]> {
  const rows = await db
    .select({
      key: userCensorshipTable.key,
      value: userCensorshipTable.value,
    })
    .from(userCensorshipTable)
    .where(and(eq(userCensorshipTable.userId, userId), eq(userCensorshipTable.level, level)))

  return rows.map((row) => ({
    key: row.key as CensorshipKey,
    value: row.value,
  }))
}

export async function selectUserInteractedMangaIds(userId: number): Promise<number[]> {
  const rows = await db.execute<MangaIdRow>(sql`
    select manga_id as "mangaId"
    from (
      select ${readingHistoryTable.mangaId} as manga_id from ${readingHistoryTable} where ${readingHistoryTable.userId} = ${userId}
      union
      select ${bookmarkTable.mangaId} from ${bookmarkTable} where ${bookmarkTable.userId} = ${userId}
      union
      select ${userRatingTable.mangaId} from ${userRatingTable} where ${userRatingTable.userId} = ${userId}
      union
      select ${libraryItemTable.mangaId}
      from ${libraryItemTable}
      inner join ${libraryTable} on ${libraryTable.id} = ${libraryItemTable.libraryId}
      where ${libraryTable.userId} = ${userId}
    ) interacted_manga
  `)

  return rows.map(({ mangaId }) => toSafeInteger(mangaId, 'mangaId'))
}

export async function selectUserPreferenceSignals(userId: number): Promise<PreferenceSignal[]> {
  const rows = await db.execute<SignalRow>(sql`
    with negative_ratings as (
      select ${userRatingTable.mangaId} as manga_id
      from ${userRatingTable}
      where ${userRatingTable.userId} = ${userId}
        and ${userRatingTable.rating} <= 2
    ),
    signal_rows as (
      select
        manga_id,
        sentiment,
        weight
      from (
        select
          ${readingHistoryTable.mangaId} as manga_id,
          'positive'::text as sentiment,
          (
            2.0 + greatest(
              0.0,
              3.0 * (1.0 - extract(epoch from (now() - ${readingHistoryTable.updatedAt})) / 7776000.0)
            )
          )::double precision as weight
        from ${readingHistoryTable}
        where ${readingHistoryTable.userId} = ${userId}
          and not exists (
            select 1
            from negative_ratings
            where negative_ratings.manga_id = ${readingHistoryTable.mangaId}
          )
        order by ${readingHistoryTable.updatedAt} desc
        limit ${HISTORY_SIGNAL_LIMIT}
      ) history_signals

      union all

      select
        manga_id,
        sentiment,
        weight
      from (
        select
          ${bookmarkTable.mangaId} as manga_id,
          'positive'::text as sentiment,
          7.0::double precision as weight
        from ${bookmarkTable}
        where ${bookmarkTable.userId} = ${userId}
          and not exists (
            select 1
            from negative_ratings
            where negative_ratings.manga_id = ${bookmarkTable.mangaId}
          )
        order by ${bookmarkTable.createdAt} desc
        limit ${BOOKMARK_SIGNAL_LIMIT}
      ) bookmark_signals

      union all

      select
        manga_id,
        sentiment,
        weight
      from (
        select
          ${userRatingTable.mangaId} as manga_id,
          case
            when ${userRatingTable.rating} >= 4 then 'positive'
            else 'negative'
          end::text as sentiment,
          case
            when ${userRatingTable.rating} >= 4 then (${userRatingTable.rating}::double precision * 1.5)
            else ((3 - ${userRatingTable.rating})::double precision * 4.0)
          end::double precision as weight
        from ${userRatingTable}
        where ${userRatingTable.userId} = ${userId}
          and (${userRatingTable.rating} >= 4 or ${userRatingTable.rating} <= 2)
        order by ${userRatingTable.updatedAt} desc
        limit ${RATING_SIGNAL_LIMIT}
      ) rating_signals

      union all

      select
        manga_id,
        sentiment,
        weight
      from (
        select
          ${libraryItemTable.mangaId} as manga_id,
          'positive'::text as sentiment,
          5.0::double precision as weight
        from ${libraryItemTable}
        inner join ${libraryTable} on ${libraryTable.id} = ${libraryItemTable.libraryId}
        where ${libraryTable.userId} = ${userId}
          and not exists (
            select 1
            from negative_ratings
            where negative_ratings.manga_id = ${libraryItemTable.mangaId}
          )
        order by ${libraryItemTable.createdAt} desc
        limit ${LIBRARY_SIGNAL_LIMIT}
      ) library_signals
    )
    select
      manga_id as "mangaId",
      sentiment,
      sum(weight)::double precision as "weight"
    from signal_rows
    group by manga_id, sentiment
    having sum(weight) > 0
    order by sum(weight) desc
    limit ${TOTAL_SIGNAL_LIMIT}
  `)

  return rows.map((row) => ({
    mangaId: toSafeInteger(row.mangaId, 'mangaId'),
    sentiment: toSignalSentiment(row.sentiment),
    weight: toFiniteNumber(row.weight, 'weight'),
  }))
}

function normalizeCandidateRows(rows: RawCandidateRow[]): CandidateRow[] {
  return rows.map((row) => ({
    mangaId: toSafeInteger(row.mangaId, 'mangaId'),
    score: toFiniteNumber(row.score, 'score'),
    reasons: row.reasons ?? [],
  }))
}

function signalValues(signals: Signal[]): SQL {
  return sql.join(
    signals.map((signal) => sql`(${signal.mangaId}::integer, ${signal.weight}::double precision)`),
    sql`, `,
  )
}

function toFiniteNumber(value: number | string, field: string) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    throw new Error(`Expected ${field} to be finite, received ${value}`)
  }

  return number
}

function toSafeInteger(value: number | string, field: string) {
  const number = Number(value)

  if (!Number.isSafeInteger(number)) {
    throw new Error(`Expected ${field} to be a safe integer, received ${value}`)
  }

  return number
}

function toSignalSentiment(value: string): SignalSentiment {
  if (value === 'positive' || value === 'negative') {
    return value
  }

  throw new Error(`Expected signal sentiment to be positive or negative, received ${value}`)
}
