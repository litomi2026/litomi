import { eq } from 'drizzle-orm'

import { bookmarkTable, readingHistoryTable, userRatingTable } from '@/database/supabase/activity'
import { userCensorshipTable } from '@/database/supabase/censorship'
import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/library'

import DataExportSectionClient from './DataExportSectionClient'

type Props = {
  userId: number
}

export default async function DataExportSection({ userId }: Readonly<Props>) {
  const counts = await getDataCounts(userId)

  return <DataExportSectionClient counts={counts} />
}

async function getDataCounts(userId: number) {
  const [history, bookmarks, ratings, libraries, censorships] = await Promise.all([
    db.$count(readingHistoryTable, eq(readingHistoryTable.userId, userId)),
    db.$count(bookmarkTable, eq(bookmarkTable.userId, userId)),
    db.$count(userRatingTable, eq(userRatingTable.userId, userId)),
    db.$count(libraryTable, eq(libraryTable.userId, userId)),
    db.$count(userCensorshipTable, eq(userCensorshipTable.userId, userId)),
  ])

  return { history, bookmarks, ratings, libraries, censorships }
}
