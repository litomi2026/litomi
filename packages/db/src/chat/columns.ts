import { timestamp } from 'drizzle-orm/cockroach-core'

// CockroachDB(cockroach-core) 전용 타임스탬프 헬퍼 — app/catalog가 쓰는 ../columns.ts는 pg-core 기반이라
// cockroachTable에 섞어 쓸 수 없어 dialect별로 분리한다.
export const createdAt = timestamp('created_at', { precision: 3, withTimezone: true }).defaultNow().notNull()

export const updatedAt = timestamp('updated_at', { precision: 3, withTimezone: true })
  .defaultNow()
  .notNull()
  .$onUpdate(() => new Date())
