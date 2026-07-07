import { DEFAULT_PLATFORM_FEE_BPS, SETTLEMENT_TAX_TYPES } from '@litomi/domain/payout/policy'
import { bigint, boolean, index, integer, pgEnum, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '../../columns'
import { userTable } from './user'

export const settlementTaxTypeEnum = pgEnum('settlement_tax_type', SETTLEMENT_TAX_TYPES)

export const chatArtistTable = pgTable.withRLS(
  'chat_artist',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
      .references(() => userTable.id, { onDelete: 'set null' })
      .unique(),
    handle: varchar({ length: 32 }).notNull().unique(),
    displayName: varchar('display_name', { length: 64 }).notNull(),
    description: text(),
    imageURL: varchar('image_url', { length: 256 }),
    emoji: varchar({ length: 16 }),
    // null = 구독 미오픈, 0 = 무료 개방(결제 없이 열람), 그 외 = 유료 월정액.
    priceAmount: bigint('price_amount', { mode: 'number' }),
    priceCurrency: varchar('price_currency', { length: 3 }).notNull().default('KRW'),
    // 플랫폼 수수료율(basis point, 1500 = 15%). 온보딩 시점 기본값으로 동결 — 이후 플랫폼 기본값을
    // 올려도 기존 아티스트는 이 값을 유지한다(grandfathering). 프로모·딜은 이 컬럼을 개별 갱신.
    feeBps: integer('fee_bps').notNull().default(DEFAULT_PLATFORM_FEE_BPS),
    // 정산 세무 유형 — individual=3.3% 원천징수(기본), business=세금계산서(원천징수 없음), non_resident=비거주자(원천징수 없음).
    settlementTaxType: settlementTaxTypeEnum('settlement_tax_type').notNull().default('individual'),
    // 비거주자의 거주 국가(ISO 3166-1 alpha-2). non_resident일 때만 의미 — 조약·해외송금·신고 기록용.
    settlementCountryCode: varchar('settlement_country_code', { length: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [index('idx_chat_artist_active').on(table.isActive)],
)
