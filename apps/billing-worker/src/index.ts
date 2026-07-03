import { createBillingGateway } from '@litomi/billing'
import { reconcileStalePendingPayments } from './reconcile'
import { processDueSubscriptions } from './renew'
import { closeMonthlyPayouts } from './settle'

const log = {
  info: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`, ...args),
}

async function main() {
  const startTime = Date.now()
  const gateway = createBillingGateway()

  if (!gateway) {
    log.error('PORTONE_API_SECRET is not configured — refusing to run a renewal pass')

    console.log(
      JSON.stringify({
        severity: 'ERROR',
        message: 'Billing worker misconfigured: PORTONE_API_SECRET missing',
      }),
    )

    process.exit(1)
  }

  try {
    const summary = await processDueSubscriptions({ gateway })
    const reconcile = await reconcileStalePendingPayments({ gateway })
    const settle = await closeMonthlyPayouts()
    const duration = (Date.now() - startTime) / 1000
    log.success(`Billing renewal pass completed in ${duration.toFixed(2)}s`)

    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Billing renewal pass completed',
        metrics: {
          ...summary,
          settle,
          reconcile,
          duration_seconds: duration,
        },
      }),
    )

    process.exit(0)
  } catch (error) {
    log.error('Fatal error during billing renewal:', error)

    console.log(
      JSON.stringify({
        severity: 'ERROR',
        message: 'Billing renewal pass failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    )

    process.exit(1)
  }
}

main()
