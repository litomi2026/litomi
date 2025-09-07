import { eq, sql } from 'drizzle-orm'
import ms from 'ms'

import type { Manga } from '@/types/manga'

import { TagCategoryName } from '@/database/enum'
import { neonDBRO } from '@/database/neon/drizzle'
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

import { CircuitBreaker, CircuitBreakerConfig } from './CircuitBreaker'

const typeMap: Record<number, string> = {
  1: '동인지',
  2: '망가',
  3: '아티스트 CG',
  4: '게임 CG',
  5: '서양',
  6: '이미지 모음',
  7: '건전',
  8: '코스프레',
  9: '아시안',
  10: '기타',
  11: '비공개',
}

const LITOMI_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  successThreshold: 3, // Close circuit after 3 consecutive successes in half-open state
  timeout: ms('2 minutes'), // Try to recover after 2 minutes
}

export class LitomiClient {
  private static instance: LitomiClient
  private readonly circuitBreaker: CircuitBreaker

  // Singleton instance
  private constructor() {
    this.circuitBreaker = new CircuitBreaker('LitomiDB', LITOMI_CIRCUIT_BREAKER_CONFIG)
  }

  static getInstance(): LitomiClient {
    if (!LitomiClient.instance) {
      LitomiClient.instance = new LitomiClient()
    }
    return LitomiClient.instance
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

    return {
      id: result.id,
      title: result.title,
      images: [],
      description: result.description ?? undefined,
      lines: result.lines ?? undefined,
      count: result.count ?? undefined,
      date: result.createdAt?.toISOString(),
      type: typeMap[result.type],
      artists: translateArtistList(result.artists, locale),
      characters: translateCharacterList(result.characters, locale),
      series: translateSeriesList(result.series, locale),
      group: translateGroupList(result.groups, locale),
      languages: translateLanguageList(result.languages, locale),
      uploader: result.uploaders[0],
      tags: result.tags
        .sort((a, b) => {
          if (a.category !== b.category) {
            return a.category - b.category
          }
          return a.value.localeCompare(b.value)
        })
        .map((t) => {
          const category = TagCategoryName[t.category] ?? 'other'
          return translateTag(category, t.value, locale)
        }),
    }
  }

  /**
   * Private method to get manga by ID with all related data
   * Optimized using correlated subqueries instead of multiple LEFT JOINs
   * to avoid cartesian product and improve performance
   */
  private async selectMangaById(id: number): Promise<Manga | null> {
    const [result] = await neonDBRO
      .select({
        id: mangaTable.id,
        title: mangaTable.title,
        description: mangaTable.description,
        lines: mangaTable.lines,
        type: mangaTable.type,
        count: mangaTable.count,
        createdAt: mangaTable.createdAt,
        // Use correlated subqueries for each relation to avoid cartesian product
        artists: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT a.value)
             FROM ${mangaArtistTable} ma
             INNER JOIN ${artistTable} a ON ma."artistId" = a.id
             WHERE ma."mangaId" = ${mangaTable.id}),
            '{}'::text[]
          )
        `,
        characters: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT c.value)
             FROM ${mangaCharacterTable} mc
             INNER JOIN ${characterTable} c ON mc."characterId" = c.id
             WHERE mc."mangaId" = ${mangaTable.id}),
            '{}'::text[]
          )
        `,
        tags: sql<{ value: string; category: number }[]>`
          COALESCE(
            (SELECT JSON_AGG(DISTINCT jsonb_build_object(
               'value', t.value,
               'category', t.category
             ))
             FROM ${mangaTagTable} mt
             INNER JOIN ${tagTable} t ON mt."tagId" = t.id
             WHERE mt."mangaId" = ${mangaTable.id}),
            '[]'::json
          )
        `,
        series: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT s.value)
             FROM ${mangaSeriesTable} ms
             INNER JOIN ${seriesTable} s ON ms."seriesId" = s.id
             WHERE ms."mangaId" = ${mangaTable.id}),
            '{}'::text[]
          )
        `,
        groups: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT g.value)
             FROM ${mangaGroupTable} mg
             INNER JOIN ${groupTable} g ON mg."groupId" = g.id
             WHERE mg."mangaId" = ${mangaTable.id}),
            '{}'::text[]
          )
        `,
        languages: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT l.value)
             FROM ${mangaLanguageTable} ml
             INNER JOIN ${languageTable} l ON ml."languageId" = l.id
             WHERE ml."mangaId" = ${mangaTable.id}),
            '{}'::text[]
          )
        `,
        uploaders: sql<string[]>`
          COALESCE(
            (SELECT ARRAY_AGG(DISTINCT u.value)
             FROM ${mangaUploaderTable} mu
             INNER JOIN ${uploaderTable} u ON mu."uploaderId" = u.id
             WHERE mu."mangaId" = ${mangaTable.id}),
            '{}'::text[]
          )
        `,
      })
      .from(mangaTable)
      .where(eq(mangaTable.id, id))

    if (!result) {
      return null
    }

    return this.convertDatabaseToManga(result)
  }
}
