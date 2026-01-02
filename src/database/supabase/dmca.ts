import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import 'server-only'

export const dmcaReporterRoleEnum = pgEnum('dmca_reporter_role', ['COPYRIGHT_OWNER', 'AUTHORIZED_AGENT'])

export const dmcaNoticeTable = pgTable(
  'dmca_notice',
  {
    id: uuid('id').primaryKey(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    locale: varchar('locale', { length: 8 }).notNull(),

    reporterName: varchar('reporter_name', { length: 128 }).notNull(),
    reporterEmail: varchar('reporter_email', { length: 320 }).notNull(),
    reporterAddress: text('reporter_address').notNull(),
    reporterPhone: varchar('reporter_phone', { length: 32 }).notNull(),
    reporterRole: dmcaReporterRoleEnum('reporter_role').notNull(),

    copyrightedWorkDescription: text('copyrighted_work_description').notNull(),
    copyrightedWorkURL: text('copyrighted_work_url'),
    infringingReferencesRaw: text('infringing_references_raw').notNull(),

    goodFaithConfirmed: boolean('good_faith_confirmed').notNull(),
    perjuryConfirmed: boolean('perjury_confirmed').notNull(),
    signature: varchar('signature', { length: 128 }).notNull(),
  },
  (table) => [index('idx_dmca_notice_created_at').on(table.createdAt.desc())],
).enableRLS()

export const dmcaNoticeTargetTable = pgTable(
  'dmca_notice_target',
  {
    noticeId: uuid('notice_id')
      .references(() => dmcaNoticeTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.noticeId, table.mangaId] }),
    index('idx_dmca_notice_target_manga_id').on(table.mangaId),
  ],
).enableRLS()

export const dmcaCounterNoticeTable = pgTable(
  'dmca_counter_notice',
  {
    id: uuid('id').primaryKey(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    locale: varchar('locale', { length: 8 }).notNull(),

    claimantName: varchar('claimant_name', { length: 128 }).notNull(),
    claimantEmail: varchar('claimant_email', { length: 320 }).notNull(),
    claimantAddress: text('claimant_address').notNull(),
    claimantPhone: varchar('claimant_phone', { length: 32 }).notNull(),

    relatedNoticeId: uuid('related_notice_id').references(() => dmcaNoticeTable.id, { onDelete: 'set null' }),
    claimDetails: text('claim_details').notNull(),
    evidenceLinks: text('evidence_links'),
    infringingReferencesRaw: text('infringing_references_raw').notNull(),
    signature: varchar('signature', { length: 128 }).notNull(),
    goodFaithConfirmed: boolean('good_faith_confirmed').notNull(),
    perjuryConfirmed: boolean('perjury_confirmed').notNull(),
  },
  (table) => [index('idx_dmca_counter_notice_created_at').on(table.createdAt.desc())],
).enableRLS()

export const dmcaCounterTargetTable = pgTable(
  'dmca_counter_target',
  {
    counterId: uuid('counter_id')
      .references(() => dmcaCounterNoticeTable.id, { onDelete: 'cascade' })
      .notNull(),
    mangaId: integer('manga_id').notNull(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.counterId, table.mangaId] }),
    index('idx_dmca_counter_target_manga_id').on(table.mangaId),
  ],
).enableRLS()
