import type { Manga } from '@litomi/domain/manga/model'

import { hiyobiClient } from '@litomi/crawler/sources/hiyobi'
import { kHentaiClient } from '@litomi/crawler/sources/k-hentai'
import { db } from '@litomi/db/app'
import { Locale } from '@litomi/domain/locale'
import { sql } from 'drizzle-orm'

import { MangaNotificationProcessor } from './MangaNotificationProcessor'

const CONFIG = {
  HIYOBI: {
    enabled: true,
    maxPages: 1,
  },
  K_HENTAI: {
    enabled: true,
    pageLimit: 50,
  },
  BATCH_SIZE: 100,
  DELAY_MS: 2000, // Delay between crawl requests to avoid rate limiting
}

const log = {
  info: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`, ...args),
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function crawlAndNotify() {
  const requiredEnvVars = ['APP_ORIGIN', 'APP_POSTGRES_URL', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY']
  const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingEnvVars.length > 0) {
    log.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
    process.exit(1)
  }

  log.info('Starting crawl and notify process...')
  const startTime = Date.now()

  try {
    await db.execute(sql`SELECT 1`)
    log.success('Database connection established')
    const processor = MangaNotificationProcessor.getInstance()

    const [hiyobiResults, kHentaiResults] = await Promise.all([crawlHiyobi(), crawlKHentai()])

    const allManga = [...hiyobiResults, ...kHentaiResults]
    log.info(`Total manga crawled: ${allManga.length}`)

    if (allManga.length === 0) {
      log.warn('No manga found during crawl')
      return
    }

    log.info('Processing manga for notifications...')
    const result = await processor.processBatches(allManga, { batchSize: CONFIG.BATCH_SIZE })

    log.success('Crawl and notify process completed!')

    const duration = Date.now() - startTime
    log.info(`Total execution time: ${(duration / 1000).toFixed(2)} seconds`)

    log.info('Results:', {
      matched: result.matched,
      notificationsSent: result.notificationsSent,
      errors: result.errors.length,
    })

    if (result.errors.length > 0) {
      log.warn('Errors encountered:')
      result.errors.forEach((error) => log.error(error))
    }

    process.exit(0)
  } catch (error) {
    log.error('Fatal error during crawl and notify:', error)
    process.exit(1)
  }
}

async function crawlHiyobi(): Promise<Manga[]> {
  if (!CONFIG.HIYOBI.enabled) {
    return []
  }

  const results: Manga[] = []

  try {
    for (let page = 1; page <= CONFIG.HIYOBI.maxPages; page++) {
      log.info(`Crawling Hiyobi page ${page}/${CONFIG.HIYOBI.maxPages}`)

      const mangas = await hiyobiClient.fetchMangas({ page, locale: Locale.KO })
      results.push(...mangas)

      log.success(`Fetched ${mangas.length} manga from Hiyobi page ${page}`)

      if (page < CONFIG.HIYOBI.maxPages) {
        await sleep(CONFIG.DELAY_MS)
      }
    }
  } catch (error) {
    log.error('Error crawling Hiyobi:', error)
  }

  return results
}

async function crawlKHentai(): Promise<Manga[]> {
  if (!CONFIG.K_HENTAI.enabled) {
    return []
  }

  const results: Manga[] = []

  try {
    log.info('Crawling K-Hentai manga')

    const mangas = await kHentaiClient.searchMangas(undefined, Locale.KO)
    results.push(...mangas)

    log.success(`Fetched ${mangas.length} manga from K-Hentai`)
  } catch (error) {
    log.error('Error crawling K-Hentai:', error)
  }

  return results
}

crawlAndNotify()
