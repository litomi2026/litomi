import { bigint, boolean, index, pgEnum, pgTable, smallint, timestamp, unique, varchar } from 'drizzle-orm/pg-core'
import 'server-only'

import { userTable } from './user'

export const bbatonGenderEnum = pgEnum('bbaton_gender', ['F', 'M'])

export const bbatonVerificationTable = pgTable(
  'bbaton_verification',
  {
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .primaryKey(),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
    bbatonUserId: varchar('bbaton_user_id', { length: 128 }).notNull(),
    adultFlag: boolean('adult_flag').notNull(),
    birthYear: smallint('birth_year').notNull(), // NOTE: 실제 생년이 아니라 나이대(예: 20대 -> 20)로 올 수 있어요
    gender: bbatonGenderEnum('gender').notNull(),
    income: varchar('income', { length: 32 }).notNull(),
    student: boolean('student').notNull(),
  },
  (table) => [
    unique('bbaton_verification_bbaton_user_id_unique').on(table.bbatonUserId),
    index('idx_bbaton_verification_verified_at').on(table.verifiedAt.desc()),
  ],
).enableRLS()


