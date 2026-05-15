import { crawlMangas } from './crawl'

const log = {
  info: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`, ...args),
}

async function main() {
  const startTime = Date.now()

  try {
    // Run the crawl job
    await crawlMangas()

    const duration = (Date.now() - startTime) / 1000
    log.success(`Crawl job completed in ${duration.toFixed(2)} seconds`)

    // Log metrics for monitoring
    console.log(
      JSON.stringify({
        severity: 'INFO',
        message: 'Crawl job completed',
        metrics: {
          duration_seconds: duration,
        },
      }),
    )

    process.exit(0)
  } catch (error) {
    log.error('Fatal error during crawl:', error)

    // Log error for monitoring
    console.log(
      JSON.stringify({
        severity: 'ERROR',
        message: 'Crawl job failed',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    )

    process.exit(1)
  }
}

main()
