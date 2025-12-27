import dayjs from 'dayjs'
import { max, min, sql } from 'drizzle-orm'

import type { LabeledValue, Manga } from '../../../src/types/manga'

import { fetchMangaFromMultiSources } from '../../../src/common/manga'
import { kHentaiClient } from '../../../src/crawler/k-hentai'
import { aivenDB } from '../../../src/database/aiven/drizzle'
import { mangaTable } from '../../../src/database/aiven/schema'
import { MangaType, TagCategory, tagCategoryNameToInt } from '../../../src/database/enum'

// Configuration
const CONFIG = {
  BATCH_DELAY_MS: 10_000, // Delay between batches
  MAX_MANGAS_TO_PROCESS: 100000, // Optional limit for total mangas to process
  CONCURRENT_REQUESTS: 10, // Number of concurrent manga fetches per batch
  MAX_RETRIES: 3, // Max retries for fetching individual manga
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
 * Fetches Korean manga IDs from K-Hentai search, then fetches full data for each
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

      // Fetch Korean manga IDs from search
      const searchParams: { search: string; nextId?: string } = { search: 'language:korean' }
      if (nextId) {
        searchParams.nextId = nextId
      }

      const searchResults = await kHentaiClient.searchMangas(searchParams, 'ko')

      if (!searchResults || searchResults.length === 0) {
        log.info('No more mangas to crawl. Reached the end.')
        break
      }

      let mangaIds = searchResults.map((manga) => manga.id)

      // Smart skipping logic:
      // 1. First, crawl newer manga (IDs > highestId in DB)
      // 2. When we reach the existing range, skip to older manga (IDs < lowestId in DB)
      // 3. This ensures we crawl both new manga and older manga, while skipping the already-crawled middle range
      if (!hasSkippedToOlderMangas && existingRange.lowestId !== null && existingRange.highestId !== null) {
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
        const idsToProcess = mangaIds.filter((id) => id > existingRange.highestId! || id < existingRange.lowestId!)

        if (idsToProcess.length === 0) {
          log.info(`All ${mangaIds.length} manga IDs in batch #${batchNumber} are already in database, skipping...`)
          const lowestId = Math.min(...mangaIds)
          nextId = lowestId.toString()
          continue
        }

        log.info(
          `Processing ${idsToProcess.length} new manga IDs from batch #${batchNumber} (${mangaIds.length - idsToProcess.length} already in DB)`,
        )
        mangaIds = idsToProcess
      }

      const validMangas: Manga[] = []

      for (let i = 0; i < mangaIds.length; i += CONFIG.CONCURRENT_REQUESTS) {
        const chunkIds = mangaIds.slice(i, Math.min(i + CONFIG.CONCURRENT_REQUESTS, mangaIds.length))

        // Fetch full manga data for each ID concurrently
        const mangaResults = await Promise.allSettled(
          chunkIds.map(async (id) => {
            const result = await crawlMangaWithRetry(id)
            totalProcessed++
            return result
          }),
        )

        // Collect successful manga fetches
        mangaResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            validMangas.push(result.value)
          } else {
            failedCount++
            if (result.status === 'fulfilled') {
              log.warn(`Manga #${chunkIds[index]} returned null (not found or error)`)
            } else {
              log.warn(`Manga #${chunkIds[index]} fetch failed: ${result.reason}`)
            }
          }
        })
      }

      // Bulk save all valid mangas from this batch
      let batchSaved = 0
      if (validMangas.length > 0) {
        try {
          const actualSaved = await bulkSaveMangasToDatabase(validMangas)
          successCount += actualSaved
          batchSaved = actualSaved
          if (actualSaved < validMangas.length) {
            log.warn(`Only ${actualSaved} out of ${validMangas.length} manga were actually saved/updated`)
          }
        } catch (error) {
          log.error(`Failed to bulk save mangas from batch #${batchNumber}:`, error)
          // Try saving individually as fallback
          for (const manga of validMangas) {
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
    const mangaValues = mangas.map((manga) => ({
      id: manga.id,
      title: manga.title,
      description: manga.description,
      lines: manga.lines,
      type: getMangaTypeValue(manga.type, manga.id),
      count: manga.count,
      createdAt: manga.date ? new Date(manga.date) : null,
    }))

    const result = await aivenDB
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
        },
      })
      .returning({ id: mangaTable.id })

    // Collect all unique values for bulk insert
    const allArtists = new Set<string>()
    const allCharacters = new Set<string>()
    const allTags = new Map<string, Set<string>>() // Map of category -> Set of values
    const allSeries = new Set<string>()
    const allGroups = new Set<string>()
    const allLanguages = new Set<string>()
    const allUploaders = new Set<string>()

    mangas.forEach((manga) => {
      manga.artists?.forEach((a) => allArtists.add(a.value))
      manga.characters?.forEach((c) => allCharacters.add(c.value))
      manga.tags?.forEach((t) => {
        if (!allTags.has(t.category)) {
          allTags.set(t.category, new Set())
        }
        allTags.get(t.category)!.add(t.value)
      })
      manga.series?.forEach((s) => allSeries.add(s.value))
      manga.group?.forEach((g) => allGroups.add(g.value))
      manga.languages?.forEach((l) => allLanguages.add(l.value))
      if (manga.uploader) allUploaders.add(manga.uploader)
    })

    // Bulk insert all unique artists and create relationships
    if (allArtists.size > 0) {
      const artistValues = sql`(${sql.join(
        Array.from(allArtists).map((value) => sql`${value}`),
        sql`), (`,
      )})`

      const artistList = sql`(${sql.join(
        Array.from(allArtists).map((value) => sql`${value}`),
        sql`, `,
      )})`

      await aivenDB.execute(sql`
          WITH inserted_artists AS (
            INSERT INTO artist (value)
            VALUES ${artistValues}
            ON CONFLICT (value) DO NOTHING
            RETURNING id, value
          ), all_artists AS (
            SELECT id, value FROM inserted_artists
            UNION
            SELECT id, value FROM artist WHERE value IN ${artistList}
          ), manga_artist_data AS (
            SELECT DISTINCT m.manga_id, a.id as artist_id
            FROM (
              VALUES ${sql.join(
                mangas.flatMap((manga) => manga.artists?.map((artist) => sql`(${manga.id}, ${artist.value})`) || []),
                sql`, `,
              )}
            ) AS m(manga_id, artist_value)
            JOIN all_artists a ON a.value = m.artist_value
          )
          INSERT INTO manga_artist ("mangaId", "artistId")
          SELECT manga_id::integer, artist_id FROM manga_artist_data
          ON CONFLICT DO NOTHING
        `)
    }

    // Similar bulk operations for other relationships
    // Characters
    if (allCharacters.size > 0) {
      const characterValues = sql`(${sql.join(
        Array.from(allCharacters).map((value) => sql`${value}`),
        sql`), (`,
      )})`

      const characterList = sql`(${sql.join(
        Array.from(allCharacters).map((value) => sql`${value}`),
        sql`, `,
      )})`

      await aivenDB.execute(sql`
          WITH inserted_characters AS (
            INSERT INTO character (value)
            VALUES ${characterValues}
            ON CONFLICT (value) DO NOTHING
            RETURNING id, value
          ), all_characters AS (
            SELECT id, value FROM inserted_characters
            UNION
            SELECT id, value FROM character WHERE value IN ${characterList}
          ), manga_character_data AS (
            SELECT DISTINCT m.manga_id, c.id as character_id
            FROM (
              VALUES ${sql.join(
                mangas.flatMap(
                  (manga) => manga.characters?.map((character) => sql`(${manga.id}, ${character.value})`) || [],
                ),
                sql`, `,
              )}
            ) AS m(manga_id, character_value)
            JOIN all_characters c ON c.value = m.character_value
          )
          INSERT INTO manga_character ("mangaId", "characterId")
          SELECT manga_id::integer, character_id FROM manga_character_data
          ON CONFLICT DO NOTHING
        `)
    }

    // Tags
    if (allTags.size > 0) {
      // Prepare all unique tag value-category pairs
      const tagPairs: Array<{ value: string; categoryNum: number }> = []
      allTags.forEach((values, category) => {
        const categoryNum = tagCategoryNameToInt[category] ?? TagCategory.OTHER
        values.forEach((value) => {
          tagPairs.push({ value, categoryNum })
        })
      })

      const tagInsertValues = sql`(${sql.join(
        tagPairs.map((pair) => sql`${pair.value}, ${pair.categoryNum}`),
        sql`), (`,
      )})`

      const tagWhereValues = sql`(${sql.join(
        tagPairs.map((pair) => sql`${pair.value}, ${pair.categoryNum}::smallint`),
        sql`), (`,
      )})`

      await aivenDB.execute(sql`
          WITH inserted_tags AS (
            INSERT INTO tag (value, category)
            VALUES ${tagInsertValues}
            ON CONFLICT (value, category) DO NOTHING
            RETURNING id, value, category
          ), all_tags AS (
            SELECT id, value, category FROM inserted_tags
            UNION
            SELECT id, value, category FROM tag 
            WHERE (value, category) IN (
              VALUES ${tagWhereValues}
            )
          ), manga_tag_data AS (
            SELECT DISTINCT m.manga_id, t.id as tag_id
            FROM (
              VALUES ${sql.join(
                mangas.flatMap(
                  (manga) =>
                    manga.tags?.map((tag) => {
                      const categoryNum = tagCategoryNameToInt[tag.category] ?? TagCategory.OTHER
                      return sql`(${manga.id}, ${tag.value}, ${categoryNum}::smallint)`
                    }) || [],
                ),
                sql`, `,
              )}
            ) AS m(manga_id, tag_value, tag_category)
            JOIN all_tags t ON t.value = m.tag_value AND t.category = m.tag_category
          )
          INSERT INTO manga_tag ("mangaId", "tagId")
          SELECT manga_id::integer, tag_id FROM manga_tag_data
          ON CONFLICT DO NOTHING
        `)
    }

    // Series
    if (allSeries.size > 0) {
      const seriesValues = sql`(${sql.join(
        Array.from(allSeries).map((value) => sql`${value}`),
        sql`), (`,
      )})`

      const seriesList = sql`(${sql.join(
        Array.from(allSeries).map((value) => sql`${value}`),
        sql`, `,
      )})`

      await aivenDB.execute(sql`
          WITH inserted_series AS (
            INSERT INTO series (value)
            VALUES ${seriesValues}
            ON CONFLICT (value) DO NOTHING
            RETURNING id, value
          ), all_series AS (
            SELECT id, value FROM inserted_series
            UNION
            SELECT id, value FROM series WHERE value IN ${seriesList}
          ), manga_series_data AS (
            SELECT DISTINCT m.manga_id, s.id as series_id
            FROM (
              VALUES ${sql.join(
                mangas.flatMap((manga) => manga.series?.map((serie) => sql`(${manga.id}, ${serie.value})`) || []),
                sql`, `,
              )}
            ) AS m(manga_id, series_value)
            JOIN all_series s ON s.value = m.series_value
          )
          INSERT INTO manga_series ("mangaId", "seriesId")
          SELECT manga_id::integer, series_id FROM manga_series_data
          ON CONFLICT DO NOTHING
        `)
    }

    // Groups
    if (allGroups.size > 0) {
      const groupValues = sql`(${sql.join(
        Array.from(allGroups).map((value) => sql`${value}`),
        sql`), (`,
      )})`

      const groupList = sql`(${sql.join(
        Array.from(allGroups).map((value) => sql`${value}`),
        sql`, `,
      )})`

      await aivenDB.execute(sql`
          WITH inserted_groups AS (
            INSERT INTO "group" (value)
            VALUES ${groupValues}
            ON CONFLICT (value) DO NOTHING
            RETURNING id, value
          ), all_groups AS (
            SELECT id, value FROM inserted_groups
            UNION
            SELECT id, value FROM "group" WHERE value IN ${groupList}
          ), manga_group_data AS (
            SELECT DISTINCT m.manga_id, g.id as group_id
            FROM (
              VALUES ${sql.join(
                mangas.flatMap((manga) => manga.group?.map((grp) => sql`(${manga.id}, ${grp.value})`) || []),
                sql`, `,
              )}
            ) AS m(manga_id, group_value)
            JOIN all_groups g ON g.value = m.group_value
          )
          INSERT INTO manga_group ("mangaId", "groupId")
          SELECT manga_id::integer, group_id FROM manga_group_data
          ON CONFLICT DO NOTHING
        `)
    }

    // Languages
    if (allLanguages.size > 0) {
      const languageValues = sql`(${sql.join(
        Array.from(allLanguages).map((value) => sql`${value}`),
        sql`), (`,
      )})`

      const languageList = sql`(${sql.join(
        Array.from(allLanguages).map((value) => sql`${value}`),
        sql`, `,
      )})`

      await aivenDB.execute(sql`
          WITH inserted_languages AS (
            INSERT INTO language (value)
            VALUES ${languageValues}
            ON CONFLICT (value) DO NOTHING
            RETURNING id, value
          ), all_languages AS (
            SELECT id, value FROM inserted_languages
            UNION
            SELECT id, value FROM language WHERE value IN ${languageList}
          ), manga_language_data AS (
            SELECT DISTINCT m.manga_id, l.id as language_id
            FROM (
              VALUES ${sql.join(
                mangas.flatMap(
                  (manga) => manga.languages?.map((language) => sql`(${manga.id}, ${language.value})`) || [],
                ),
                sql`, `,
              )}
            ) AS m(manga_id, language_value)
            JOIN all_languages l ON l.value = m.language_value
          )
          INSERT INTO manga_language ("mangaId", "languageId")
          SELECT manga_id::integer, language_id FROM manga_language_data
          ON CONFLICT DO NOTHING
        `)
    }

    // Uploaders
    if (allUploaders.size > 0) {
      const uploaderValues = sql`(${sql.join(
        Array.from(allUploaders).map((value) => sql`${value}`),
        sql`), (`,
      )})`

      const uploaderList = sql`(${sql.join(
        Array.from(allUploaders).map((value) => sql`${value}`),
        sql`, `,
      )})`

      await aivenDB.execute(sql`
          WITH inserted_uploaders AS (
            INSERT INTO uploader (value)
            VALUES ${uploaderValues}
            ON CONFLICT (value) DO NOTHING
            RETURNING id, value
          ), all_uploaders AS (
            SELECT id, value FROM inserted_uploaders
            UNION
            SELECT id, value FROM uploader WHERE value IN ${uploaderList}
          ), manga_uploader_data AS (
            SELECT DISTINCT m.manga_id, u.id as uploader_id
            FROM (
              VALUES ${sql.join(
                mangas.filter((manga) => manga.uploader).map((manga) => sql`(${manga.id}, ${manga.uploader})`),
                sql`, `,
              )}
            ) AS m(manga_id, uploader_value)
            JOIN all_uploaders u ON u.value = m.uploader_value
          )
          INSERT INTO manga_uploader ("mangaId", "uploaderId")
          SELECT manga_id::integer, uploader_id FROM manga_uploader_data
          ON CONFLICT DO NOTHING
        `)
    }

    return result.length
  } catch (error) {
    log.error(`Failed to bulk save mangas:`, error)
    throw error
  }
}

/**
 * Crawl manga data for a specific ID with retry logic
 */
async function crawlMangaWithRetry(id: number, retries = CONFIG.MAX_RETRIES): Promise<Manga | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        log.info(`Fetching manga #${id} (attempt ${attempt}/${retries})...`)
      }
      const result = await fetchMangaFromMultiSources({ id, locale: 'ko' })

      if (!result) {
        log.warn(`No data found for manga #${id}`)
        return null
      }

      if ('isError' in result) {
        log.warn(`Error for manga #${id}: ${result.title}`)
        return null
      }

      return result
    } catch (error) {
      log.error(`Attempt ${attempt} failed for manga #${id}:`, error)
      if (attempt < retries) {
        await sleep(CONFIG.RETRY_DELAY_MS)
      } else {
        log.error(`All attempts failed for manga #${id}`)
        return null
      }
    }
  }

  return null
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
    const result = await aivenDB
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
    doujinshi: MangaType.DOUJINSHI,
    'artist cg': MangaType.ARTIST_CG,
    'artist-cg': MangaType.ARTIST_CG,
    artist_cg: MangaType.ARTIST_CG,
    artistcg: MangaType.ARTIST_CG,
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

/**
 * Save manga data to database (fallback for individual saves)
 */
async function saveMangaToDatabase(manga: Manga) {
  try {
    // NOTE: neon-http driver doesn't support transactions, so we execute operations sequentially
    // This is less atomic but should work for the crawl script
    // Insert or update main manga record
    await aivenDB
      .insert(mangaTable)
      .values({
        id: manga.id,
        title: manga.title,
        description: manga.description,
        lines: manga.lines,
        type: getMangaTypeValue(manga.type, manga.id),
        count: manga.count,
        createdAt: manga.date ? new Date(manga.date) : null,
      })
      .onConflictDoUpdate({
        target: mangaTable.id,
        set: {
          title: manga.title,
          description: manga.description,
          lines: manga.lines,
          type: getMangaTypeValue(manga.type, manga.id),
          count: manga.count,
          createdAt: manga.date ? new Date(manga.date) : null,
        },
      })

    // Handle artists
    if (manga.artists && manga.artists.length > 0) {
      for (const artist of manga.artists) {
        // Single query to handle both entity and junction table
        await aivenDB.execute(sql`
            WITH artist_id AS (
              -- First try to insert, returns ID if successful
              INSERT INTO artist (value)
              VALUES (${artist.value})
              ON CONFLICT (value) DO NOTHING
              RETURNING id
            ), existing_or_new AS (
              -- Get the ID from insert or from existing record
              SELECT id FROM artist_id
              UNION ALL
              SELECT id FROM artist WHERE value = ${artist.value} AND NOT EXISTS (SELECT 1 FROM artist_id)
            )
            -- Insert into junction table
            INSERT INTO manga_artist ("mangaId", "artistId")
            SELECT ${manga.id}, id FROM existing_or_new
            ON CONFLICT DO NOTHING
          `)
      }
    }

    // Handle characters
    if (manga.characters && manga.characters.length > 0) {
      for (const character of manga.characters) {
        // Single query to handle both entity and junction table
        await aivenDB.execute(sql`
            WITH character_id AS (
              -- First try to insert, returns ID if successful
              INSERT INTO character (value)
              VALUES (${character.value})
              ON CONFLICT (value) DO NOTHING
              RETURNING id
            ), existing_or_new AS (
              -- Get the ID from insert or from existing record
              SELECT id FROM character_id
              UNION ALL
              SELECT id FROM character WHERE value = ${character.value} AND NOT EXISTS (SELECT 1 FROM character_id)
            )
            -- Insert into junction table
            INSERT INTO manga_character ("mangaId", "characterId")
            SELECT ${manga.id}, id FROM existing_or_new
            ON CONFLICT DO NOTHING
          `)
      }
    }

    // Handle tags
    if (manga.tags && manga.tags.length > 0) {
      for (const tag of manga.tags) {
        const categoryNum = tagCategoryNameToInt[tag.category] ?? TagCategory.OTHER
        // Single query to handle both entity and junction table
        await aivenDB.execute(sql`
            WITH tag_id AS (
              -- First try to insert, returns ID if successful
              INSERT INTO tag (value, category)
              VALUES (${tag.value}, ${categoryNum}::smallint)
              ON CONFLICT (value, category) DO NOTHING
              RETURNING id
            ), existing_or_new AS (
              -- Get the ID from insert or from existing record
              SELECT id FROM tag_id
              UNION ALL
              SELECT id FROM tag WHERE value = ${tag.value} AND category = ${categoryNum}::smallint AND NOT EXISTS (SELECT 1 FROM tag_id)
            )
            -- Insert into junction table
            INSERT INTO manga_tag ("mangaId", "tagId")
            SELECT ${manga.id}::integer, id FROM existing_or_new
            ON CONFLICT DO NOTHING
          `)
      }
    }

    // Handle series
    if (manga.series && manga.series.length > 0) {
      for (const serie of manga.series) {
        // Single query to handle both entity and junction table
        await aivenDB.execute(sql`
            WITH series_id AS (
              -- First try to insert, returns ID if successful
              INSERT INTO series (value)
              VALUES (${serie.value})
              ON CONFLICT (value) DO NOTHING
              RETURNING id
            ), existing_or_new AS (
              -- Get the ID from insert or from existing record
              SELECT id FROM series_id
              UNION ALL
              SELECT id FROM series WHERE value = ${serie.value} AND NOT EXISTS (SELECT 1 FROM series_id)
            )
            -- Insert into junction table
            INSERT INTO manga_series ("mangaId", "seriesId")
            SELECT ${manga.id}, id FROM existing_or_new
            ON CONFLICT DO NOTHING
          `)
      }
    }

    // Handle groups
    if (manga.group && manga.group.length > 0) {
      for (const grp of manga.group) {
        // Single query to handle both entity and junction table
        await aivenDB.execute(sql`
            WITH group_id AS (
              -- First try to insert, returns ID if successful
              INSERT INTO "group" (value)
              VALUES (${grp.value})
              ON CONFLICT (value) DO NOTHING
              RETURNING id
            ), existing_or_new AS (
              -- Get the ID from insert or from existing record
              SELECT id FROM group_id
              UNION ALL
              SELECT id FROM "group" WHERE value = ${grp.value} AND NOT EXISTS (SELECT 1 FROM group_id)
            )
            -- Insert into junction table
            INSERT INTO manga_group ("mangaId", "groupId")
            SELECT ${manga.id}, id FROM existing_or_new
            ON CONFLICT DO NOTHING
          `)
      }
    }

    // Handle languages
    if (manga.languages && manga.languages.length > 0) {
      for (const language of manga.languages) {
        // Single query to handle both entity and junction table
        await aivenDB.execute(sql`
            WITH language_id AS (
              -- First try to insert, returns ID if successful
              INSERT INTO language (value)
              VALUES (${language.value})
              ON CONFLICT (value) DO NOTHING
              RETURNING id
            ), existing_or_new AS (
              -- Get the ID from insert or from existing record
              SELECT id FROM language_id
              UNION ALL
              SELECT id FROM language WHERE value = ${language.value} AND NOT EXISTS (SELECT 1 FROM language_id)
            )
            -- Insert into junction table
            INSERT INTO manga_language ("mangaId", "languageId")
            SELECT ${manga.id}, id FROM existing_or_new
            ON CONFLICT DO NOTHING
          `)
      }
    }

    // Handle uploader
    if (manga.uploader) {
      // Single query to handle both entity and junction table
      await aivenDB.execute(sql`
          WITH uploader_id AS (
            -- First try to insert, returns ID if successful
            INSERT INTO uploader (value)
            VALUES (${manga.uploader})
            ON CONFLICT (value) DO NOTHING
            RETURNING id
          ), existing_or_new AS (
            -- Get the ID from insert or from existing record
            SELECT id FROM uploader_id
            UNION ALL
            SELECT id FROM uploader WHERE value = ${manga.uploader} AND NOT EXISTS (SELECT 1 FROM uploader_id)
          )
          -- Insert into junction table
          INSERT INTO manga_uploader ("mangaId", "uploaderId")
          SELECT ${manga.id}, id FROM existing_or_new
          ON CONFLICT DO NOTHING
        `)
    }
  } catch (error) {
    log.error(`Failed to save manga #${manga.id}:`, error)
    throw error
  }
}

// Run the crawl if this file is executed directly
if (require.main === module) {
  crawlMangas().catch((error) => {
    log.error('Fatal error:', error)
    process.exit(1)
  })
}
