import { createBillingGateway } from '@litomi/billing'
import { processDueSubscriptions } from './renew'

const log = {
  info: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`, ...args),
}

async function main() {
  const startTime = Date.now()

  // Composition root. A billing worker that cannot charge is a broken deploy, not a quiet
  // day — fail loudly so the CronJob shows Failed (→ alert) instead of a green run that
  // silently bills no one. Failing before we touch a single row also means a missing secret
  // can never expire a renewable subscription.
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
    const duration = (Date.now() - startTime) / 1000
    log.success(`Billing renewal pass completed in ${duration.toFixed(2)}s`)

    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Billing renewal pass completed',
        metrics: { duration_seconds: duration, ...summary },
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
