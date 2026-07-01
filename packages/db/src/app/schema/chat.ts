import { bigint, boolean, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { userTable } from './user'

export const chatArtistTable = pgTable(
  'chat_artist',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    handle: varchar({ length: 32 }).notNull().unique(),
    displayName: varchar('display_name', { length: 64 }).notNull(),
    description: text(),
    imageURL: varchar('image_url', { length: 256 }),
    emoji: varchar({ length: 16 }),
    priceAmount: bigint('price_amount', { mode: 'number' }).notNull().default(0),
    priceCurrency: varchar('price_currency', { length: 3 }).notNull().default('KRW'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_chat_artist_active').on(table.isActive)],
).enableRLS()
