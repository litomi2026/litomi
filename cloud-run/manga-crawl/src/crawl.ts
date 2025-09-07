import dayjs from 'dayjs'
import { desc, sql } from 'drizzle-orm'

import type { Manga } from '../../../src/types/manga'

import { getMangaFromMultiSources } from '../../../src/common/manga'
import { KHentaiClient } from '../../../src/crawler/k-hentai'
import { MangaType, TagCategoryFromName } from '../../../src/database/enum'
import { neonDB } from '../../../src/database/neon/drizzle'
import { mangaTable } from '../../../src/database/neon/schema'

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  CONCURRENT_REQUESTS: 10,
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
 * Fetches manga from the highest ID in DB to the latest ID from K-Hentai
 */
export async function crawlMangas() {
  const startTime = Date.now()

  try {
    // Step 1: Fetch highest manga ID from neon DB
    const highestDBId = await getHighestMangaIdFromDB()
    log.info(`Highest manga ID in database: ${highestDBId || 'None (empty database)'}`)

    // Step 2: Get manga IDs from K-Hentai (single API call)
    const kHentaiInfo = await getKHentaiMangaRange()
    if (!kHentaiInfo) {
      log.warn('Could not fetch manga info from K-Hentai')
      return
    }
    log.info(`K-Hentai manga range: ${kHentaiInfo.lowestId} to ${kHentaiInfo.highestId}`)

    // Step 3: Determine the range to crawl
    // If DB is empty, start from the lowest K-Hentai ID; otherwise, continue from where we left off
    const startId = highestDBId ? highestDBId + 1 : kHentaiInfo.lowestId
    const endId = kHentaiInfo.highestId

    if (startId > endId) {
      log.info('Database is already up to date. No new mangas to crawl.')
      return
    }

    const totalCount = endId - startId + 1
    log.info(`Starting manga crawl from ID ${startId} to ${endId} (${totalCount} mangas)`)

    // Step 3 & 4: Fetch and save manga information
    let processedCount = 0
    let successCount = 0
    let failedCount = 0

    // Process IDs in chunks for concurrent processing
    // for (let i = startId; i <= endId; i += CONFIG.CONCURRENT_REQUESTS) {
    for (let i = startId; i <= 3_525_000; i += CONFIG.CONCURRENT_REQUESTS) {
      const chunkStartTimestamp = Date.now()
      const chunkIds: number[] = []

      for (let j = i; j < Math.min(i + CONFIG.CONCURRENT_REQUESTS, endId + 1); j++) {
        chunkIds.push(j)
      }

      // Fetch all mangas in the chunk concurrently
      const mangaResults = await Promise.allSettled(chunkIds.map(async (id) => crawlMangaWithRetry(id)))

      // Filter out successful manga fetches
      const validMangas: Manga[] = []
      mangaResults.forEach((result) => {
        processedCount++
        if (result.status === 'fulfilled' && result.value) {
          validMangas.push(result.value)
        } else {
          failedCount++
        }
      })

      // Bulk save all valid mangas in this chunk
      if (validMangas.length > 0) {
        try {
          await bulkSaveMangasToDatabase(validMangas)
          successCount += validMangas.length
          log.success(`Bulk saved ${validMangas.length} mangas`)
        } catch (error) {
          log.error(`Failed to bulk save mangas:`, error)
          for (const manga of validMangas) {
            try {
              await saveMangaToDatabase(manga)
              successCount++
            } catch (e) {
              failedCount++
              log.error(`Failed to save manga #${manga.id}:`, e)
            }
          }
        }
      }

      log.info(`Progress: ${processedCount}/${totalCount} processed (${successCount} saved, ${failedCount} failed)`)

      const elapsedTime = Date.now() - chunkStartTimestamp
      const sleepTime = Math.max(0, 20_000 - elapsedTime)

      if (sleepTime > 0) {
        await sleep(sleepTime)
      }
    }

    const duration = (Date.now() - startTime) / 1000
    log.success(`Crawl completed! Processed ${totalCount} manga IDs in ${duration.toFixed(2)} seconds`)
    log.success(`Results: ${successCount} saved, ${failedCount} failed`)
  } catch (error) {
    log.error('Crawl failed:', error)
    throw error
  }
}

/**
 * Bulk save multiple mangas to database without transactions
 */
async function bulkSaveMangasToDatabase(mangas: Manga[]) {
  try {
    // NOTE: neon-http driver doesn't support transactions, so we execute operations sequentially
    // This is less atomic but should work for the crawl script
    // Bulk insert manga records
    const mangaValues = mangas.map((manga) => ({
      id: manga.id,
      title: manga.title,
      description: manga.description,
      lines: manga.lines,
      type: getMangaTypeValue(manga.type),
      count: manga.count,
      createdAt: manga.date ? new Date(manga.date) : null,
    }))

    await neonDB
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

      await neonDB.execute(sql`
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

      await neonDB.execute(sql`
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
        const categoryNum =
          TagCategoryFromName[category as keyof typeof TagCategoryFromName] ?? TagCategoryFromName['other']
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

      await neonDB.execute(sql`
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
                      const categoryNum =
                        TagCategoryFromName[tag.category as keyof typeof TagCategoryFromName] ??
                        TagCategoryFromName['other']
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

      await neonDB.execute(sql`
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

      await neonDB.execute(sql`
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

      await neonDB.execute(sql`
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

      await neonDB.execute(sql`
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
      log.info(`Fetching manga #${id} (attempt ${attempt}/${retries})...`)
      const result = await getMangaFromMultiSources(id)

      if (!result) {
        log.warn(`No data found for manga #${id}`)
        return null
      }

      if ('isError' in result && result.isError) {
        log.warn(`Error for manga #${id}: ${result.title}`)
        return null
      }

      return result as Manga
    } catch (error) {
      log.error(`Attempt ${attempt} failed for manga #${id}:`, error)
      if (attempt < retries) {
        await sleep(CONFIG.RETRY_DELAY_MS)
      } else {
        throw error
      }
    }
  }

  return null
}

/**
 * Fetch the highest manga ID from the neon database
 */
async function getHighestMangaIdFromDB(): Promise<number | null> {
  try {
    const result = await neonDB.select({ id: mangaTable.id }).from(mangaTable).orderBy(desc(mangaTable.id)).limit(1)

    return result.length > 0 ? result[0].id : null
  } catch (error) {
    log.error('Failed to fetch highest manga ID from database:', error)
    throw error
  }
}

/**
 * Fetch manga ID range from K-Hentai with a single API call
 * Returns both the highest (latest) and lowest IDs from the results
 */
async function getKHentaiMangaRange(): Promise<{ highestId: number; lowestId: number } | null> {
  try {
    const kHentaiClient = KHentaiClient.getInstance()
    // Fetch the newest mangas - this gives us the latest manga ID
    const mangas = await kHentaiClient.searchMangas()

    if (mangas && mangas.length > 0) {
      // The first manga should be the newest one (highest ID)
      const highestId = mangas[0].id
      // Find the lowest ID from the returned results
      const lowestId = Math.min(...mangas.map((m) => m.id))

      return { highestId, lowestId }
    }

    return null
  } catch (error) {
    log.error('Failed to fetch manga range from K-Hentai:', error)
    throw error
  }
}

/**
 * Map manga type string to enum value
 */
function getMangaTypeValue(type?: string): number {
  const typeMap: Record<string, MangaType> = {
    manga: MangaType.MANGA,
    doujinshi: MangaType.DOUJINSHI,
    'artist cg': MangaType.ARTIST_CG,
    'game cg': MangaType.GAME_CG,
    'image set': MangaType.IMAGE_SET,
    cosplay: MangaType.COSPLAY,
    'asian porn': MangaType.ASIAN_PORN,
    'non-h': MangaType.NON_H,
    western: MangaType.WESTERN,
    misc: MangaType.MISC,
  }

  if (!type) return MangaType.MISC
  return typeMap[type.toLowerCase()] ?? MangaType.MISC
}

/**
 * Save manga data to database (fallback for individual saves)
 */
async function saveMangaToDatabase(manga: Manga) {
  try {
    // NOTE: neon-http driver doesn't support transactions, so we execute operations sequentially
    // This is less atomic but should work for the crawl script
    // Insert or update main manga record
    await neonDB
      .insert(mangaTable)
      .values({
        id: manga.id,
        title: manga.title,
        description: manga.description,
        lines: manga.lines,
        type: getMangaTypeValue(manga.type),
        count: manga.count,
        createdAt: manga.date ? new Date(manga.date) : null,
      })
      .onConflictDoUpdate({
        target: mangaTable.id,
        set: {
          title: manga.title,
          description: manga.description,
          lines: manga.lines,
          type: getMangaTypeValue(manga.type),
          count: manga.count,
          createdAt: manga.date ? new Date(manga.date) : null,
        },
      })

    // Handle artists
    if (manga.artists && manga.artists.length > 0) {
      for (const artist of manga.artists) {
        // Single query to handle both entity and junction table
        await neonDB.execute(sql`
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
        await neonDB.execute(sql`
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
        const categoryNum =
          TagCategoryFromName[tag.category as keyof typeof TagCategoryFromName] ?? TagCategoryFromName['other']
        // Single query to handle both entity and junction table
        await neonDB.execute(sql`
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
        await neonDB.execute(sql`
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
        await neonDB.execute(sql`
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
        await neonDB.execute(sql`
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
      await neonDB.execute(sql`
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

    log.success(`Saved manga #${manga.id}: ${manga.title}`)
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
