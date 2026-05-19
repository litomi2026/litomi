import type { Manga } from '@litomi/domain/types/manga'

import { translateArtistList } from '@litomi/catalog/translation/artist'
import { translateCharacterList } from '@litomi/catalog/translation/character'
import { translateGroupList } from '@litomi/catalog/translation/group'
import { translateLanguageList } from '@litomi/catalog/translation/language'
import { translateSeriesList } from '@litomi/catalog/translation/series'
import { translateTag } from '@litomi/catalog/translation/tag'
import { translateType } from '@litomi/catalog/translation/type'
import { catalogDB } from '@litomi/db/database/catalog/drizzle'
import { mangaTable } from '@litomi/db/database/catalog/schema'
import { tagCategoryIntToName } from '@litomi/domain/database/enum'
import { eq, inArray, sql } from 'drizzle-orm'
import ms from 'ms'

import { CircuitBreaker, CircuitBreakerConfig } from './CircuitBreaker'

const typeMap: Record<number, string> = {
  1: 'doujinshi',
  2: 'manga',
  3: 'artist_cg',
  4: 'game_cg',
  5: 'western',
  6: 'image_set',
  7: 'non-h',
  8: 'cosplay',
  9: 'asian',
  10: 'misc',
  11: 'private',
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
   * Fetch multiple mangas by ID from the database.
   */
  async getMangas(ids: readonly number[]): Promise<Map<number, Manga>> {
    const uniqueIds = Array.from(new Set(ids))

    if (uniqueIds.length === 0) {
      return new Map()
    }

    return this.circuitBreaker.execute(() => this.selectMangasByIds(uniqueIds))
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
    series: string[]
    groups: string[]
    languages: string[]
    uploader: string | null
    tagValues: string[]
    tagCategories: number[]
  }): Manga {
    const locale = 'ko' // TODO: Get from user preferences or context

    const tags = result.tagValues.map((value, index) => ({
      value,
      category: result.tagCategories[index] ?? 3,
    }))

    return {
      id: result.id,
      title: result.title,
      images: [],
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
      uploader: result.uploader ?? undefined,
      tags: tags
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
    return catalogDB
      .select({
        id: mangaTable.id,
        title: mangaTable.title,
        description: mangaTable.description,
        lines: mangaTable.lines,
        type: mangaTable.type,
        count: mangaTable.count,
        createdAt: mangaTable.createdAt,
        artists: mangaTable.artists,
        characters: mangaTable.characters,
        series: mangaTable.series,
        groups: mangaTable.groups,
        languages: mangaTable.languages,
        uploader: mangaTable.uploader,
        tagValues: mangaTable.tagValues,
        tagCategories: mangaTable.tagCategories,
      })
      .from(mangaTable)
      .where(eq(mangaTable.id, sql.placeholder('mangaId')))
      .prepare('selectMangaById')
  }

  private async selectMangaById(id: number): Promise<Manga | null> {
    const [result] = await this.preparedSelectMangaById.execute({ mangaId: id })

    if (!result) {
      return null
    }

    return this.convertDatabaseToManga(result)
  }

  private async selectMangasByIds(ids: number[]): Promise<Map<number, Manga>> {
    const results = await catalogDB
      .select({
        id: mangaTable.id,
        title: mangaTable.title,
        description: mangaTable.description,
        lines: mangaTable.lines,
        type: mangaTable.type,
        count: mangaTable.count,
        createdAt: mangaTable.createdAt,
        artists: mangaTable.artists,
        characters: mangaTable.characters,
        series: mangaTable.series,
        groups: mangaTable.groups,
        languages: mangaTable.languages,
        uploader: mangaTable.uploader,
        tagValues: mangaTable.tagValues,
        tagCategories: mangaTable.tagCategories,
      })
      .from(mangaTable)
      .where(inArray(mangaTable.id, ids))

    return new Map(results.map((result) => [result.id, this.convertDatabaseToManga(result)]))
  }
}

// Singleton instance
export const litomiClient = new LitomiClient()
