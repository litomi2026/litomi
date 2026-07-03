import { markPayoutPaid } from '@litomi/db/app/query/payout'

// 수동 이체 완료 후 운영자가 실행: bun tools/markPayoutPaid.ts <payoutId>
// pending 상태의 payout만 paid로 전환한다(관리자 UI가 생기기 전까지의 운영 경로).
const payoutId = Number(process.argv[2])

if (!Number.isInteger(payoutId) || payoutId <= 0) {
  console.error('Usage: bun tools/markPayoutPaid.ts <payoutId>')
  process.exit(1)
}

const marked = await markPayoutPaid(payoutId, new Date())

if (marked) {
  console.log(`payout ${payoutId} → paid`)
} else {
  console.error(`payout ${payoutId}: pending 상태가 아니거나 존재하지 않아요`)
  process.exitCode = 1
}

process.exit()
