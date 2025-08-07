import { sql } from 'drizzle-orm'

import type { Manga } from '../src/types/manga'

import { HarpiComicKind, HarpiListMode, HarpiRandomMode, HarpiSort } from '../src/app/api/proxy/harpi/search/schema'
import { HarpiClient } from '../src/crawler/harpi'
import { HiyobiClient } from '../src/crawler/hiyobi'
import { KHentaiClient } from '../src/crawler/k-hentai'
import { db } from '../src/database/drizzle'
import { BookmarkSource } from '../src/database/enum'
import { MangaNotificationProcessor } from './MangaNotificationProcessor'

const CONFIG = {
  HARPI: {
    enabled: true,
    maxPages: 1,
  },
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
  const requiredEnvVars = ['POSTGRES_URL', 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY']
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

    const [harpiResults, hiyobiResults, kHentaiResults] = await Promise.all([
      crawlHarpi(),
      crawlHiyobi(),
      crawlKHentai(),
    ])

    const allManga = [...harpiResults, ...hiyobiResults, ...kHentaiResults]
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

async function crawlHarpi(): Promise<Array<{ manga: Manga; source: BookmarkSource }>> {
  if (!CONFIG.HARPI.enabled) return []

  const client = HarpiClient.getInstance()
  const results: Array<{ manga: Manga; source: BookmarkSource }> = []

  try {
    for (let page = 0; page < CONFIG.HARPI.maxPages; page++) {
      log.info(`Crawling Harpi page ${page + 1}/${CONFIG.HARPI.maxPages}`)

      const mangas = await client.fetchMangas({
        comicKind: HarpiComicKind.EMPTY,
        isIncludeTagsAnd: true,
        minImageCount: 0,
        maxImageCount: 0,
        listMode: HarpiListMode.SORT,
        randomMode: HarpiRandomMode.SEARCH,
        page,
        pageLimit: 10,
        sort: HarpiSort.DATE_DESC,
      })

      results.push(...mangas.map((manga) => ({ manga, source: BookmarkSource.HARPI })))

      log.success(`Fetched ${mangas.length} manga from Harpi page ${page + 1}`)

      if (page < CONFIG.HARPI.maxPages - 1) {
        await sleep(CONFIG.DELAY_MS)
      }
    }
  } catch (error) {
    log.error('Error crawling Harpi:', error)
  }

  return results
}

async function crawlHiyobi(): Promise<Array<{ manga: Manga; source: BookmarkSource }>> {
  if (!CONFIG.HIYOBI.enabled) return []

  const client = HiyobiClient.getInstance()
  const results: Array<{ manga: Manga; source: BookmarkSource }> = []

  try {
    for (let page = 1; page <= CONFIG.HIYOBI.maxPages; page++) {
      log.info(`Crawling Hiyobi page ${page}/${CONFIG.HIYOBI.maxPages}`)

      const mangas = await client.fetchMangas(page)
      results.push(...mangas.map((manga) => ({ manga, source: BookmarkSource.HIYOBI })))

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

async function crawlKHentai(): Promise<Array<{ manga: Manga; source: BookmarkSource }>> {
  if (!CONFIG.K_HENTAI.enabled) return []

  const client = KHentaiClient.getInstance()
  const results: Array<{ manga: Manga; source: BookmarkSource }> = []

  try {
    log.info('Crawling K-Hentai manga')

    const mangas = await client.searchMangas()
    results.push(...mangas.map((manga) => ({ manga, source: BookmarkSource.K_HENTAI })))

    log.success(`Fetched ${mangas.length} manga from K-Hentai`)
  } catch (error) {
    log.error('Error crawling K-Hentai:', error)
  }

  return results
}

crawlAndNotify()
