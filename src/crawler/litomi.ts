import { eq, sql } from 'drizzle-orm'

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
  mangaRelatedTable,
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

export class LitomiClient {
  private static instance: LitomiClient

  // Singleton instance
  private constructor() {}

  static getInstance(): LitomiClient {
    if (!LitomiClient.instance) {
      LitomiClient.instance = new LitomiClient()
    }
    return LitomiClient.instance
  }

  /**
   * Fetch a single manga by ID from the database
   */
  async getManga(id: number): Promise<Manga | null> {
    return this.selectMangaById(id)
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
    related: number[]
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
      tags: result.tags.map((t) => {
        const category = TagCategoryName[t.category] ?? 'other'
        return translateTag(category, t.value, locale)
      }),
      related: result.related.length > 0 ? result.related : undefined,
    }
  }

  /**
   * Private method to get manga by ID with all related data
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
        artists: sql<string[]>`
          COALESCE(
            ARRAY_AGG(DISTINCT ${artistTable.value}) 
            FILTER (WHERE ${artistTable.value} IS NOT NULL), 
            '{}'::text[]
          )
        `,
        characters: sql<string[]>`
          COALESCE(
            ARRAY_AGG(DISTINCT ${characterTable.value}) 
            FILTER (WHERE ${characterTable.value} IS NOT NULL), 
            '{}'::text[]
          )
        `,
        tags: sql<{ value: string; category: number }[]>`
          COALESCE(
            JSON_AGG(DISTINCT jsonb_build_object(
              'value', ${tagTable.value},
              'category', ${tagTable.category}
            )) FILTER (WHERE ${tagTable.value} IS NOT NULL),
            '[]'::json
          )
        `,
        series: sql<string[]>`
          COALESCE(
            ARRAY_AGG(DISTINCT ${seriesTable.value}) 
            FILTER (WHERE ${seriesTable.value} IS NOT NULL), 
            '{}'::text[]
          )
        `,
        groups: sql<string[]>`
          COALESCE(
            ARRAY_AGG(DISTINCT ${groupTable.value}) 
            FILTER (WHERE ${groupTable.value} IS NOT NULL), 
            '{}'::text[]
          )
        `,
        languages: sql<string[]>`
          COALESCE(
            ARRAY_AGG(DISTINCT ${languageTable.value}) 
            FILTER (WHERE ${languageTable.value} IS NOT NULL), 
            '{}'::text[]
          )
        `,
        uploaders: sql<string[]>`
          COALESCE(
            ARRAY_AGG(DISTINCT ${uploaderTable.value}) 
            FILTER (WHERE ${uploaderTable.value} IS NOT NULL), 
            '{}'::text[]
          )
        `,
        related: sql<number[]>`
          COALESCE(
            ARRAY_AGG(DISTINCT ${mangaRelatedTable.relatedMangaId}) 
            FILTER (WHERE ${mangaRelatedTable.relatedMangaId} IS NOT NULL), 
            '{}'::int[]
          )
        `,
      })
      .from(mangaTable)
      .leftJoin(mangaArtistTable, eq(mangaTable.id, mangaArtistTable.mangaId))
      .leftJoin(artistTable, eq(mangaArtistTable.artistId, artistTable.id))
      .leftJoin(mangaCharacterTable, eq(mangaTable.id, mangaCharacterTable.mangaId))
      .leftJoin(characterTable, eq(mangaCharacterTable.characterId, characterTable.id))
      .leftJoin(mangaTagTable, eq(mangaTable.id, mangaTagTable.mangaId))
      .leftJoin(tagTable, eq(mangaTagTable.tagId, tagTable.id))
      .leftJoin(mangaSeriesTable, eq(mangaTable.id, mangaSeriesTable.mangaId))
      .leftJoin(seriesTable, eq(mangaSeriesTable.seriesId, seriesTable.id))
      .leftJoin(mangaGroupTable, eq(mangaTable.id, mangaGroupTable.mangaId))
      .leftJoin(groupTable, eq(mangaGroupTable.groupId, groupTable.id))
      .leftJoin(mangaLanguageTable, eq(mangaTable.id, mangaLanguageTable.mangaId))
      .leftJoin(languageTable, eq(mangaLanguageTable.languageId, languageTable.id))
      .leftJoin(mangaUploaderTable, eq(mangaTable.id, mangaUploaderTable.mangaId))
      .leftJoin(uploaderTable, eq(mangaUploaderTable.uploaderId, uploaderTable.id))
      .leftJoin(mangaRelatedTable, eq(mangaTable.id, mangaRelatedTable.mangaId))
      .where(eq(mangaTable.id, id))
      .groupBy(mangaTable.id)

    if (!result) {
      return null
    }

    return this.convertDatabaseToManga(result)
  }
}
