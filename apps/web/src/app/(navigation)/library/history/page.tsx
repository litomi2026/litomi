import { getAccessTokenClaimsFromCookie } from '@litomi/auth/cookie'
import { db } from '@litomi/db/app'
import { readingHistoryTable } from '@litomi/db/app/activity'
import { encodeReadingHistoryCursor } from '@litomi/domain/common/cursor'
import { READING_HISTORY_PER_PAGE } from '@litomi/domain/constants/policy'
import { desc, eq } from 'drizzle-orm'
import { Metadata } from 'next'
import { headers } from 'next/headers'

import { generateOpenGraphMetadata } from '@/lib/metadata'

import HistoryPageClient from './HistoryPageClient'
import NotFound from './NotFound'

export const metadata: Metadata = {
  title: '감상 기록',
  ...generateOpenGraphMetadata({
    title: '감상 기록',
    url: '/library/history',
  }),
  alternates: {
    canonical: '/library/history',
    languages: { ko: '/library/history' },
  },
}

export default async function HistoryPage() {
  const claims = await getAccessTokenClaimsFromCookie()
  const headersList = await headers()
  const country = headersList.get('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
  const canUseServerHistory = Boolean(claims) && (country !== 'KR' || claims?.adult === true)

  if (!claims || !canUseServerHistory) {
    return (
      <main className="flex-1 flex flex-col">
        <HistoryPageClient source="local" />
      </main>
    )
  }

  const history = await db
    .select({
      mangaId: readingHistoryTable.mangaId,
      lastPage: readingHistoryTable.lastPage,
      updatedAt: readingHistoryTable.updatedAt,
    })
    .from(readingHistoryTable)
    .where(eq(readingHistoryTable.userId, claims.userId))
    .orderBy(desc(readingHistoryTable.updatedAt), desc(readingHistoryTable.mangaId))
    .limit(READING_HISTORY_PER_PAGE + 1)

  if (history.length === 0) {
    return <NotFound />
  }

  const hasNextPage = history.length > READING_HISTORY_PER_PAGE

  if (hasNextPage) {
    history.pop()
  }

  const items = history.map((h) => ({
    mangaId: h.mangaId,
    lastPage: h.lastPage,
    updatedAt: h.updatedAt.getTime(),
  }))

  const lastItem = items[items.length - 1]
  const nextCursor = hasNextPage ? encodeReadingHistoryCursor(lastItem.updatedAt, lastItem.mangaId) : null

  const initialData = {
    items,
    nextCursor,
  }

  return (
    <main className="flex-1 flex flex-col">
      <HistoryPageClient initialData={initialData} source="server" />
    </main>
  )
}
