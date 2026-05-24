import type { LabeledValue, Manga } from '@litomi/domain/manga/model'

import { kHentaiClient, type KHentaiMangaSearchOptions } from '@litomi/crawler/sources/k-hentai'
import { catalogDB } from '@litomi/db/catalog'
import { mangaTable } from '@litomi/db/catalog/schema'
import { Locale } from '@litomi/domain/locale'
import { MangaType, TagCategory, tagCategoryNameToInt } from '@litomi/domain/manga/model'
import dayjs from 'dayjs'
import { max, min, sql } from 'drizzle-orm'

// Configuration
const CONFIG = {
  BATCH_DELAY_MS: 10_000, // Delay between batches
  MAX_MANGAS_TO_PROCESS: 100000, // Optional limit for total mangas to process
  MAX_RETRIES: 3, // Max retries for fetching a search batch
  RETRY_DELAY_MS: 5000, // Delay between retries
}

const dateFormat = 'YYYY-MM-DD HH:mm:ss'

const log = {
  info: (msg: string, ...args: unknown[]) => console.log(`[${dayjs().format(dateFormat)}] ℹ️  ${msg}`, ...args),
  success: (msg: string, ...args: unknown[]) => console.log(`[${dayjs().format(dateFormat)}] ✅ ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[${dayjs().format(dateFormat)}] ❌ ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(`[${dayjs().format(dateFormat)}] ⚠️  ${msg}`, ...args),
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Main crawl function
 * Fetches Korean manga metadata from K-Hentai search and saves it to the catalog database.
 */
export async function crawlMangas() {
  const startTime = Date.now()

  try {
    // Get existing manga ID range from database to skip already crawled manga
    const existingRange = await getExistingMangaIdRange()

    log.info(
      `Existing manga ID range in database: ${
        existingRange.lowestId !== null && existingRange.highestId !== null
          ? `${existingRange.lowestId} to ${existingRange.highestId}`
          : 'Database is empty'
      }`,
    )

    let nextId: string | undefined = undefined
    let hasSkippedToOlderMangas = false

    let totalProcessed = 0
    let successCount = 0
    let failedCount = 0
    let batchNumber = 0

    while (true) {
      batchNumber++
      const batchStartTime = Date.now()

      log.info(`Fetching batch #${batchNumber} ${nextId ? `(starting from ID: ${nextId})` : '(initial batch)'}`)

      // Fetch Korean manga metadata from search
      const searchParams: KHentaiMangaSearchOptions = { search: 'language:korean' }
      if (nextId) {
        searchParams.nextId = nextId
      }

      const searchResults = await fetchKoreanMangaBatchWithRetry(searchParams)

      if (searchResults.length === 0) {
        log.info('No more mangas to crawl. Reached the end.')
        break
      }

      let mangasToProcess = searchResults

      // Smart skipping logic:
      // 1. First, crawl newer manga (IDs > highestId in DB)
      // 2. When we reach the existing range, skip to older manga (IDs < lowestId in DB)
      // 3. This ensures we crawl both new manga and older manga, while skipping the already-crawled middle range
      if (!hasSkippedToOlderMangas && existingRange.lowestId !== null && existingRange.highestId !== null) {
        const mangaIds = searchResults.map((manga) => manga.id)

        // Check if any of the current batch IDs are within or below our existing range
        const maxBatchId = Math.max(...mangaIds)
        const minBatchId = Math.min(...mangaIds)

        if (maxBatchId <= existingRange.highestId) {
          // We've reached the already-crawled range, skip to older manga
          log.info(
            `Already-crawled range (id: ${minBatchId}-${maxBatchId}). Skipping to nextId: ${existingRange.lowestId}`,
          )
          nextId = existingRange.lowestId.toString()
          hasSkippedToOlderMangas = true
          continue // Skip this batch and fetch with new nextId
        }

        // Filter out IDs that are already in the database
        mangasToProcess = searchResults.filter(
          (manga) => manga.id > existingRange.highestId! || manga.id < existingRange.lowestId!,
        )

        if (mangasToProcess.length === 0) {
          log.info(
            `All ${searchResults.length} manga IDs in batch #${batchNumber} are already in database, skipping...`,
          )
          const lowestId = Math.min(...mangaIds)
          nextId = lowestId.toString()
          continue
        }

        log.info(
          `Processing ${mangasToProcess.length} new manga IDs from batch #${batchNumber} (${searchResults.length - mangasToProcess.length} already in DB)`,
        )
      }

      totalProcessed += mangasToProcess.length

      // Bulk save all mangas from this batch
      let batchSaved = 0
      if (mangasToProcess.length > 0) {
        try {
          const actualSaved = await bulkSaveMangasToDatabase(mangasToProcess)
          successCount += actualSaved
          batchSaved = actualSaved
          if (actualSaved < mangasToProcess.length) {
            log.warn(`Only ${actualSaved} out of ${mangasToProcess.length} manga were actually saved/updated`)
          }
        } catch (error) {
          log.error(`Failed to bulk save mangas from batch #${batchNumber}:`, error)
          // Try saving individually as fallback
          for (const manga of mangasToProcess) {
            try {
              await saveMangaToDatabase(manga)
              successCount++
              batchSaved++
            } catch (e) {
              failedCount++
              log.error(`Failed to save manga #${manga.id}:`, e)
            }
          }
        }
      }

      // Get the lowest ID from search results to use as nextId for pagination
      // Since default sort is id_desc, the last manga has the lowest ID
      // Note: We use the original search results, not filtered IDs
      const lowestId = Math.min(...searchResults.map((m) => m.id))
      nextId = lowestId.toString()

      log.success(
        `Batch #${batchNumber} completed: [Batch: ${batchSaved} saved] [Total: ${successCount} saved, ${failedCount} failed]`,
      )

      // Add delay between batches to respect rate limits
      const elapsedTime = Date.now() - batchStartTime
      const sleepTime = Math.max(0, CONFIG.BATCH_DELAY_MS - elapsedTime)

      if (sleepTime > 0) {
        await sleep(sleepTime)
      }

      // Optional: Add a stop condition (e.g., after processing a certain number of mangas)
      // This can be removed if you want to crawl everything
      if (CONFIG.MAX_MANGAS_TO_PROCESS && totalProcessed >= CONFIG.MAX_MANGAS_TO_PROCESS) {
        log.info(`Reached processing limit of ${CONFIG.MAX_MANGAS_TO_PROCESS.toLocaleString()} mangas. Stopping.`)
        break
      }
    }

    const duration = (Date.now() - startTime) / 1000
    log.success(`Crawl completed! Processed ${totalProcessed} Korean mangas in ${duration.toFixed(2)} seconds`)
    log.success(`Results: ${successCount} saved, ${failedCount} failed`)
  } catch (error) {
    log.error('Crawl failed:', error)
    throw error
  }
}

/**
 * Bulk save multiple mangas to database without transactions
 * Returns the number of mangas that were actually saved (inserted or updated)
 */
async function bulkSaveMangasToDatabase(mangas: Manga[]): Promise<number> {
  try {
    const mangaValues = mangas.map(toMangaRow)

    const result = await catalogDB
      .insert(mangaTable)
      .values(mangaValues)
      .onConflictDoUpdate({
        target: mangaTable.id,
        set: {
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          lines: sql`excluded.lines`,
          type: sql`excluded.type`,
          count: sql`excluded.count`,
          createdAt: sql`excluded.created_at`,
          artists: sql`excluded.artists`,
          characters: sql`excluded.characters`,
          series: sql`excluded.series`,
          groups: sql`excluded.groups`,
          languages: sql`excluded.languages`,
          uploader: sql`excluded.uploader`,
          tagValues: sql`excluded.tag_values`,
          tagCategories: sql`excluded.tag_categories`,
        },
      })
      .returning({ id: mangaTable.id })

    return result.length
  } catch (error) {
    log.error(`Failed to bulk save mangas:`, error)
    throw error
  }
}

/**
 * Fetch K-Hentai search results with retry logic.
 */
async function fetchKoreanMangaBatchWithRetry(
  searchParams: KHentaiMangaSearchOptions,
  retries = CONFIG.MAX_RETRIES,
): Promise<Manga[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        log.info(`Fetching K-Hentai search batch (attempt ${attempt}/${retries})...`)
      }

      return kHentaiClient.searchMangas(searchParams, Locale.KO)
    } catch (error) {
      log.error(`Attempt ${attempt} failed while fetching K-Hentai search batch:`, error)
      if (attempt < retries) {
        await sleep(CONFIG.RETRY_DELAY_MS)
      } else {
        log.error('All attempts failed while fetching K-Hentai search batch')
        throw error
      }
    }
  }

  throw new Error('K-Hentai search batch retry count must be greater than 0')
}

/**
 * Get the range of manga IDs already in the database
 */
async function getExistingMangaIdRange(
  enabled: boolean = true,
): Promise<{ lowestId: number | null; highestId: number | null }> {
  if (!enabled) {
    return {
      lowestId: null,
      highestId: null,
    }
  }

  try {
    const result = await catalogDB
      .select({
        lowestId: min(mangaTable.id),
        highestId: max(mangaTable.id),
      })
      .from(mangaTable)

    return {
      lowestId: result[0]?.lowestId ?? null,
      highestId: result[0]?.highestId ?? null,
    }
  } catch (error) {
    log.error('Failed to fetch manga ID range from database:', error)
    throw error
  }
}

/**
 * Map manga type LabeledValue to enum value
 */
function getMangaTypeValue(type: LabeledValue | undefined, mangaId: number): number {
  const typeMap: Record<string, MangaType> = {
    // English mappings
    manga: MangaType.MANGA,
    'hentai manga': MangaType.MANGA,
    'hentai-manga': MangaType.MANGA,
    hentai_manga: MangaType.MANGA,
    doujinshi: MangaType.DOUJINSHI,
    'artist cg': MangaType.ARTIST_CG,
    'artist-cg': MangaType.ARTIST_CG,
    artist_cg: MangaType.ARTIST_CG,
    artistcg: MangaType.ARTIST_CG,
    'hentai cg': MangaType.ARTIST_CG,
    'hentai-cg': MangaType.ARTIST_CG,
    hentai_cg: MangaType.ARTIST_CG,
    'game cg': MangaType.GAME_CG,
    'game-cg': MangaType.GAME_CG,
    game_cg: MangaType.GAME_CG,
    gamecg: MangaType.GAME_CG,
    'image set': MangaType.IMAGE_SET,
    'image-set': MangaType.IMAGE_SET,
    image_set: MangaType.IMAGE_SET,
    imageset: MangaType.IMAGE_SET,
    cosplay: MangaType.COSPLAY,
    'asian porn': MangaType.ASIAN_PORN,
    'asian-porn': MangaType.ASIAN_PORN,
    asian_porn: MangaType.ASIAN_PORN,
    asianporn: MangaType.ASIAN_PORN,
    asian: MangaType.ASIAN_PORN,
    'non-h': MangaType.NON_H,
    'non h': MangaType.NON_H,
    non_h: MangaType.NON_H,
    nonh: MangaType.NON_H,
    western: MangaType.WESTERN,
    misc: MangaType.MISC,
    other: MangaType.MISC,

    // Korean mappings
    동인지: MangaType.DOUJINSHI,
    만화: MangaType.MANGA,
    망가: MangaType.MANGA,
    '아티스트 cg': MangaType.ARTIST_CG,
    아티스트cg: MangaType.ARTIST_CG,
    아티스트_cg: MangaType.ARTIST_CG,
    '게임 cg': MangaType.GAME_CG,
    게임cg: MangaType.GAME_CG,
    게임_cg: MangaType.GAME_CG,
    서양: MangaType.WESTERN,
    '이미지 모음': MangaType.IMAGE_SET,
    이미지모음: MangaType.IMAGE_SET,
    이미지_모음: MangaType.IMAGE_SET,
    건전: MangaType.NON_H,
    코스프레: MangaType.COSPLAY,
    아시안: MangaType.ASIAN_PORN,
    기타: MangaType.MISC,
    비공개: MangaType.HIDDEN,
    private: MangaType.HIDDEN,
    hidden: MangaType.HIDDEN,
  }

  if (!type) {
    log.warn(`No type provided for manga #${mangaId}, defaulting to MISC`)
    return MangaType.MISC
  }

  const normalizedType = type.value.toLowerCase().trim()
  const mappedType = typeMap[normalizedType]

  if (mappedType === undefined) {
    log.warn(`Unknown manga type: "${type.value}" for manga #${mangaId}, defaulting to MISC`)
    return MangaType.MISC
  }

  return mappedType
}

function getTagColumns(manga: Manga): Pick<typeof mangaTable.$inferInsert, 'tagCategories' | 'tagValues'> {
  const tagValues: string[] = []
  const tagCategories: number[] = []
  const seen = new Set<string>()

  for (const tag of manga.tags ?? []) {
    const category = tagCategoryNameToInt[tag.category] ?? TagCategory.OTHER
    const key = `${category}:${tag.value}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    tagValues.push(tag.value)
    tagCategories.push(category)
  }

  return { tagValues, tagCategories }
}

function getUniqueValues(values: LabeledValue[] | undefined): string[] {
  return [...new Set(values?.map((value) => value.value) ?? [])]
}

/**
 * Save manga data to database (fallback for individual saves)
 */
async function saveMangaToDatabase(manga: Manga) {
  try {
    const mangaRow = toMangaRow(manga)

    await catalogDB
      .insert(mangaTable)
      .values(mangaRow)
      .onConflictDoUpdate({
        target: mangaTable.id,
        set: {
          title: mangaRow.title,
          description: mangaRow.description,
          lines: mangaRow.lines,
          type: mangaRow.type,
          count: mangaRow.count,
          createdAt: mangaRow.createdAt,
          artists: mangaRow.artists,
          characters: mangaRow.characters,
          series: mangaRow.series,
          groups: mangaRow.groups,
          languages: mangaRow.languages,
          uploader: mangaRow.uploader,
          tagValues: mangaRow.tagValues,
          tagCategories: mangaRow.tagCategories,
        },
      })
  } catch (error) {
    log.error(`Failed to save manga #${manga.id}:`, error)
    throw error
  }
}

/**
 * Convert crawler metadata into the compact catalog read model.
 */
function toMangaRow(manga: Manga): typeof mangaTable.$inferInsert {
  const { tagValues, tagCategories } = getTagColumns(manga)

  return {
    id: manga.id,
    title: manga.title,
    description: manga.description ?? null,
    lines: manga.lines ?? [],
    type: getMangaTypeValue(manga.type, manga.id),
    count: manga.count ?? null,
    createdAt: manga.date ? new Date(manga.date) : null,
    artists: getUniqueValues(manga.artists),
    characters: getUniqueValues(manga.characters),
    series: getUniqueValues(manga.series),
    groups: getUniqueValues(manga.group),
    languages: getUniqueValues(manga.languages),
    uploader: manga.uploader ?? null,
    tagValues,
    tagCategories,
  }
}

// Run the crawl if this file is executed directly
if (require.main === module) {
  crawlMangas().catch((error) => {
    log.error('Fatal error:', error)
    process.exit(1)
  })
}
