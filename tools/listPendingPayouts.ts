import { decryptSecret } from '@litomi/auth/secret-crypto'
import { db } from '@litomi/db/app'
import { chatArtistTable } from '@litomi/db/app/chat'
import { payoutAccountTable, payoutTable } from '@litomi/db/app/payout'
import { eq } from 'drizzle-orm'

// 수동 이체용 지급 대기 목록: bun tools/listPendingPayouts.ts
// 이체 후 tools/markPayoutPaid.ts <payoutId>로 완료 처리한다.
const rows = await db
  .select({
    id: payoutTable.id,
    handle: chatArtistTable.handle,
    displayName: chatArtistTable.displayName,
    periodStart: payoutTable.periodStart,
    payableAmount: payoutTable.payableAmount,
    currency: payoutTable.currency,
    bankName: payoutAccountTable.bankName,
    accountNumber: payoutAccountTable.accountNumber,
    holderName: payoutAccountTable.holderName,
  })
  .from(payoutTable)
  .leftJoin(chatArtistTable, eq(chatArtistTable.id, payoutTable.chatArtistId))
  .leftJoin(payoutAccountTable, eq(payoutAccountTable.userId, payoutTable.userId))
  .where(eq(payoutTable.status, 'pending'))
  .orderBy(payoutTable.periodStart)

if (rows.length === 0) {
  console.log('지급 대기 중인 정산이 없어요.')
}

for (const row of rows) {
  const period = row.periodStart.toISOString().slice(0, 7)
  const account = row.accountNumber
    ? `${row.bankName} ${decryptSecret(row.accountNumber)} (${row.holderName})`
    : '⚠️ 계좌 미등록'

  console.log(
    `#${row.id} ${period} ${row.displayName ?? '(삭제된 아티스트)'}${row.handle ? ` @${row.handle}` : ''} — ${row.payableAmount.toLocaleString('ko-KR')}${row.currency === 'KRW' ? '원' : ` ${row.currency}`} → ${account}`,
  )
}

process.exit()
