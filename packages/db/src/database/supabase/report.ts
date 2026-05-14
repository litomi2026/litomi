import { bigint, index, integer, pgEnum, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

export const mangaReportReasonEnum = pgEnum('manga_report_reason', ['DEEPFAKE', 'REAL_PERSON_MINOR'])

export const mangaReportTable = pgTable(
  'manga_report',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    reason: mangaReportReasonEnum('reason').notNull(),
    reportedAt: timestamp('reported_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.mangaId] }),
    index('idx_manga_report_manga_id').on(table.mangaId),
    index('idx_manga_report_reported_at').on(table.reportedAt.desc()),
    index('idx_manga_report_reason_reported_at').on(table.reason, table.reportedAt.desc()),
  ],
).enableRLS()
