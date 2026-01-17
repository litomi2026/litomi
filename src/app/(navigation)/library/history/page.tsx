import { desc, eq } from 'drizzle-orm'
import { Metadata } from 'next'
import { headers } from 'next/headers'

import { encodeReadingHistoryCursor } from '@/common/cursor'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import { generateOpenGraphMetadata } from '@/constants'
import { READING_HISTORY_PER_PAGE } from '@/constants/policy'
import { readingHistoryTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'
import { userTable } from '@/database/supabase/user'
import { getAccessTokenClaimsFromCookie } from '@/utils/cookie'

import HistoryPageClient from './HistoryPageClient'
import NotFound from './NotFound'
import Unauthorized from './Unauthorized'

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

  if (!claims) {
    return <Unauthorized />
  }

  const headersList = await headers()
  const country = headersList.get('CF-IPCountry')?.trim().toUpperCase() ?? 'KR'
  const isAdultVerificationRequired = country === 'KR'

  if (isAdultVerificationRequired && claims.adult !== true) {
    const [user] = await db.select({ name: userTable.name }).from(userTable).where(eq(userTable.id, claims.userId))

    return (
      <AdultVerificationGate
        description="감상 기록을 보려면 익명 성인인증이 필요해요"
        title="성인인증이 필요해요"
        username={user?.name}
      />
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
      <h1 className="sr-only">감상 기록</h1>
      <HistoryPageClient initialData={initialData} />
    </main>
  )
}
