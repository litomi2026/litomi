import { sql } from 'drizzle-orm'
import ms from 'ms'

import type { Manga } from '@/types/manga'

import { aivenDB } from '@/database/aiven/drizzle'
import { tagCategoryIntToName } from '@/database/enum'
import {
  artistTable,
  characterTable,
  groupTable,
  languageTable,
  mangaArtistTable,
  mangaCharacterTable,
  mangaGroupTable,
  mangaLanguageTable,
  mangaSeriesTable,
  mangaTable,
  mangaTagTable,
  mangaUploaderTable,
  seriesTable,
  tagTable,
  uploaderTable,
} from '@/database/neon/schema'
import { translateArtistList } from '@/translation/artist'
import { translateCharacterList } from '@/translation/character'
import { translateGroupList } from '@/translation/group'
import { translateLanguageList } from '@/translation/language'
import { translateSeriesList } from '@/translation/series'
import { translateTag } from '@/translation/tag'
import { translateType } from '@/translation/type'

import { CircuitBreaker, CircuitBreakerConfig } from './CircuitBreaker'

const R2_ORIGIN_URL = 'https://r2.litomi.in'

// TODO: 작품 id 동적으로 관리하기
const R2_MANGA_IDS = [3540978, 3542485]

const typeMap: Record<number, string> = {
  1: 'doujinshi',
  2: 'manga',
  3: 'artist_cg',
  4: 'game_cg',
  5: 'western',
  6: 'image_set',
  7: 'non_h',
  8: 'cosplay',
  9: 'asian_porn',
  10: 'misc',
  11: 'hidden',
}

const LITOMI_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  successThreshold: 3, // Close circuit after 3 consecutive successes in half-open state
  timeout: ms('2 minutes'), // Try to recover after 2 minutes
}

class LitomiClient {
  private readonly circuitBreaker: CircuitBreaker
  private readonly preparedSelectMangaById: ReturnType<typeof this.prepareMangaQuery>

  constructor() {
    this.circuitBreaker = new CircuitBreaker('LitomiDB', LITOMI_CIRCUIT_BREAKER_CONFIG)
    this.preparedSelectMangaById = this.prepareMangaQuery()
  }

  /**
   * Get the current state of the circuit breaker
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState()
  }

  /**
   * Fetch a single manga by ID from the database
   */
  async getManga(id: number): Promise<Manga | null> {
    return this.circuitBreaker.execute(() => this.selectMangaById(id))
  }

  /**
   * Convert database result to Manga format
   */
  private convertDatabaseToManga(result: {
    id: number
    title: string
    description: string | null
    lines: string[] | null
    type: number
    count: number | null
    createdAt: Date | null
    artists: string[]
    characters: string[]
    tags: { value: string; category: number }[]
    series: string[]
    groups: string[]
    languages: string[]
    uploaders: string[]
  }): Manga {
    const locale = 'ko' // TODO: Get from user preferences or context
    const isR2Manga = R2_MANGA_IDS.includes(result.id)

    return {
      id: result.id,
      title: result.title,
      images: isR2Manga
        ? Array.from({ length: result.count ?? 0 }, (_, i) => ({
            original: { url: `${R2_ORIGIN_URL}/${result.id}/${i}.avif` },
          }))
        : [],
      description: result.description ?? undefined,
      lines: result.lines ?? undefined,
      count: result.count ?? undefined,
      date: result.createdAt?.toISOString(),
      type: translateType(typeMap[result.type], locale),
      artists: translateArtistList(result.artists, locale),
      characters: translateCharacterList(result.characters, locale),
      series: translateSeriesList(result.series, locale),
      group: translateGroupList(result.groups, locale),
      languages: translateLanguageList(result.languages, locale),
      uploader: result.uploaders[0],
      tags: result.tags
        .sort((a, b) => a.category - b.category)
        .map((t) => {
          const category = tagCategoryIntToName[t.category] ?? 'other'
          return translateTag(category, t.value, locale)
        })
        .sort((a, b) => {
          if (a.category === b.category) {
            return a.label.localeCompare(b.label)
          }
          return 0
        }),
    }
  }

  private prepareMangaQuery() {
    return aivenDB
      .select({
        id: mangaTable.id,
        title: mangaTable.title,
        description: mangaTable.description,
        lines: mangaTable.lines,
        type: mangaTable.type,
        count: mangaTable.count,
        createdAt: mangaTable.createdAt,
        artists: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(${artistTable.value})
             FROM ${mangaArtistTable}
             INNER JOIN ${artistTable} ON ${mangaArtistTable.artistId} = ${artistTable.id}
             WHERE ${mangaArtistTable.mangaId} = ${sql.placeholder('mangaId')}),
            '{}'::text[]
          )
        `,
        characters: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(${characterTable.value})
             FROM ${mangaCharacterTable}
             INNER JOIN ${characterTable} ON ${mangaCharacterTable.characterId} = ${characterTable.id}
             WHERE ${mangaCharacterTable.mangaId} = ${sql.placeholder('mangaId')}),
            '{}'::text[]
          )
        `,
        tags: sql<{ value: string; category: number }[]>`
          COALESCE(
            (SELECT JSON_AGG(tag_data)
             FROM (
               SELECT jsonb_build_object(
                 'value', ${tagTable.value},
                 'category', ${tagTable.category}
               ) as tag_data
               FROM ${mangaTagTable}
               INNER JOIN ${tagTable} ON ${mangaTagTable.tagId} = ${tagTable.id}
               WHERE ${mangaTagTable.mangaId} = ${sql.placeholder('mangaId')}
             ) sub),
            '[]'::json
          )
        `,
        series: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(${seriesTable.value})
             FROM ${mangaSeriesTable}
             INNER JOIN ${seriesTable} ON ${mangaSeriesTable.seriesId} = ${seriesTable.id}
             WHERE ${mangaSeriesTable.mangaId} = ${sql.placeholder('mangaId')}),
            '{}'::text[]
          )
        `,
        groups: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(${groupTable.value})
             FROM ${mangaGroupTable}
             INNER JOIN ${groupTable} ON ${mangaGroupTable.groupId} = ${groupTable.id}
             WHERE ${mangaGroupTable.mangaId} = ${sql.placeholder('mangaId')}),
            '{}'::text[]
          )
        `,
        languages: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(${languageTable.value})
             FROM ${mangaLanguageTable}
             INNER JOIN ${languageTable} ON ${mangaLanguageTable.languageId} = ${languageTable.id}
             WHERE ${mangaLanguageTable.mangaId} = ${sql.placeholder('mangaId')}),
            '{}'::text[]
          )
        `,
        uploaders: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(${uploaderTable.value})
             FROM ${mangaUploaderTable}
             INNER JOIN ${uploaderTable} ON ${mangaUploaderTable.uploaderId} = ${uploaderTable.id}
             WHERE ${mangaUploaderTable.mangaId} = ${sql.placeholder('mangaId')}),
            '{}'::text[]
          )
        `,
      })
      .from(mangaTable)
      .where(sql`${mangaTable.id} = ${sql.placeholder('mangaId')}`)
      .prepare('selectMangaById')
  }

  private async selectMangaById(id: number): Promise<Manga | null> {
    const [result] = await this.preparedSelectMangaById.execute({ mangaId: id })

    if (!result) {
      return null
    }

    return this.convertDatabaseToManga(result)
  }
}

// Singleton instance
export const litomiClient = new LitomiClient()
