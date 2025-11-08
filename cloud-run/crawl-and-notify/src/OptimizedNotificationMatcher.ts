import { and, count, eq, inArray, or, SQL, sql } from 'drizzle-orm'

import type { Manga } from '../../../src/types/manga'

import { NotificationConditionType } from '../../../src/database/enum'
import { db } from '../../../src/database/supabase/drizzle'
import {
  notificationConditionTable,
  notificationCriteriaTable,
} from '../../../src/database/supabase/notification-schema'

export interface MangaMetadata {
  artists?: string[]
  characters?: string[]
  groups?: string[]
  languages?: string[]
  mangaId: number
  series?: string[]
  tags?: string[]
  uploader?: string
}

/**
 * Database optimization recommendations:
 * 1. Ensure index exists: idx_notification_condition_type_value (type, value)
 * 2. Ensure index exists: idx_notification_criteria_user_active (userId, isActive)
 * 3. Consider partial index on notification_condition for frequently queried types
 * 4. Monitor pg_stat_user_indexes for index usage patterns
 *
 * Performance characteristics:
 * - Uses only 2 database queries regardless of manga count
 * - Minimizes data transfer by fetching only required fields
 * - Performs matching logic in-memory for optimal performance
 */
export class OptimizedNotificationMatcher {
  private static instance: OptimizedNotificationMatcher

  static getInstance(): OptimizedNotificationMatcher {
    if (!OptimizedNotificationMatcher.instance) {
      OptimizedNotificationMatcher.instance = new OptimizedNotificationMatcher()
    }
    return OptimizedNotificationMatcher.instance
  }

  convertMangaToMetadata(manga: Manga): MangaMetadata {
    return {
      mangaId: manga.id,
      series: manga.series?.map((s) => s.value) || [],
      characters: manga.characters?.map((c) => c.value) || [],
      tags: manga.tags?.map((t) => t.value) || [],
      artists: manga.artists?.map((a) => a.value) || [],
      groups: manga.group?.map((g) => g.value) || [],
      languages: manga.languages?.map((l) => l.value) || [],
      uploader: manga.uploader,
    }
  }

  /**
   * Find all users whose notification criteria match the given manga metadata
   *
   * Algorithm:
   * 1. Extract and normalize all values from manga metadata
   * 2. Query database for all conditions that match any of these values
   * 3. Check that ALL included conditions match AND NO excluded conditions match
   * 4. Return only criteria where conditions are satisfied
   *
   * @param metadataList - Array of manga metadata to match
   * @returns Map<mangaId, Array<{userId, criteriaId, criteriaName}>>
   */
  async findMatchingUsersWithCriteria(metadataList: MangaMetadata[]) {
    if (metadataList.length === 0) {
      return
    }

    // Step 1: Collect all unique normalized values by type from all manga
    const valuesByType = new Map<NotificationConditionType, Set<string>>()
    const mangaValueMaps = new Map<number, Map<NotificationConditionType, Set<string>>>()

    for (const metadata of metadataList) {
      const mangaValues = this.extractNormalizedValues(metadata)
      mangaValueMaps.set(metadata.mangaId, mangaValues)

      // Aggregate all values by type
      for (const [type, values] of mangaValues) {
        const typeSet = valuesByType.get(type) || new Set()
        values.forEach((v) => typeSet.add(v))
        valuesByType.set(type, typeSet)
      }
    }

    // Step 2: Build conditions for the query
    const conditions: (SQL | undefined)[] = []

    for (const [type, values] of valuesByType) {
      if (values.size > 0) {
        conditions.push(
          and(eq(notificationConditionTable.type, type), inArray(notificationConditionTable.value, Array.from(values))),
        )
      }
    }

    if (conditions.length === 0) {
      return
    }

    // Step 3: Query all matching conditions with their criteria info in a single query
    // This query is optimized to use the composite index on (type, value)
    const matchingConditions = await db
      .select({
        criteriaId: notificationConditionTable.criteriaId,
        conditionType: notificationConditionTable.type,
        conditionValue: notificationConditionTable.value,
        isExcluded: notificationConditionTable.isExcluded,
        userId: notificationCriteriaTable.userId,
        criteriaName: notificationCriteriaTable.name,
      })
      .from(notificationConditionTable)
      .innerJoin(
        notificationCriteriaTable,
        and(
          eq(notificationConditionTable.criteriaId, notificationCriteriaTable.id),
          eq(notificationCriteriaTable.isActive, true),
        ),
      )
      .where(or(...conditions))

    if (matchingConditions.length === 0) {
      return
    }

    // Step 4: Get total condition counts for each criteria
    const criteriaIds = Array.from(new Set(matchingConditions.map((mc) => mc.criteriaId)))

    if (criteriaIds.length === 0) {
      return
    }

    const criteriaConditionCounts = await db
      .select({
        criteriaId: notificationConditionTable.criteriaId,
        isExcluded: notificationConditionTable.isExcluded,
        conditionCount: count(),
      })
      .from(notificationConditionTable)
      .where(inArray(notificationConditionTable.criteriaId, criteriaIds))
      .groupBy(notificationConditionTable.criteriaId, notificationConditionTable.isExcluded)

    // Separate counts for included and excluded conditions
    const includedCountMap = new Map<number, number>()
    const excludedCountMap = new Map<number, number>()

    for (const cc of criteriaConditionCounts) {
      if (cc.isExcluded) {
        excludedCountMap.set(cc.criteriaId, cc.conditionCount)
      } else {
        includedCountMap.set(cc.criteriaId, cc.conditionCount)
      }
    }

    // Step 5: Build criteria -> conditions mapping
    const criteriaConditionsMap = new Map<
      number,
      {
        userId: number
        criteriaName: string
        includedConditions: Map<string, NotificationConditionType>
        excludedConditions: Map<string, NotificationConditionType>
        requiredIncludedCount: number
      }
    >()

    for (const mc of matchingConditions) {
      if (!criteriaConditionsMap.has(mc.criteriaId)) {
        criteriaConditionsMap.set(mc.criteriaId, {
          userId: mc.userId,
          criteriaName: mc.criteriaName,
          includedConditions: new Map(),
          excludedConditions: new Map(),
          requiredIncludedCount: includedCountMap.get(mc.criteriaId) || 0,
        })
      }

      const criteria = criteriaConditionsMap.get(mc.criteriaId)!
      if (mc.isExcluded) {
        criteria.excludedConditions.set(mc.conditionValue, mc.conditionType)
      } else {
        criteria.includedConditions.set(mc.conditionValue, mc.conditionType)
      }
    }

    // Step 6: Check which manga match which criteria (included and excluded conditions)
    //
    const result = new Map<number, Array<{ userId: number; criteriaId: number; criteriaName: string }>>()

    for (const [mangaId, mangaValues] of mangaValueMaps) {
      const matches: { userId: number; criteriaId: number; criteriaName: string }[] = []

      for (const [criteriaId, criteriaData] of criteriaConditionsMap) {
        let includedMatchCount = 0
        let hasExcludedMatch = false

        // Check included conditions
        for (const [conditionValue, conditionType] of criteriaData.includedConditions) {
          const mangaTypeValues = mangaValues.get(conditionType)
          if (mangaTypeValues && mangaTypeValues.has(conditionValue)) {
            includedMatchCount++
          }
        }

        // Check excluded conditions - if any match, skip this criteria
        for (const [conditionValue, conditionType] of criteriaData.excludedConditions) {
          const mangaTypeValues = mangaValues.get(conditionType)
          if (mangaTypeValues && mangaTypeValues.has(conditionValue)) {
            hasExcludedMatch = true
            break
          }
        }

        // All included conditions must match AND no excluded conditions must match
        if (
          !hasExcludedMatch &&
          includedMatchCount === criteriaData.requiredIncludedCount &&
          criteriaData.requiredIncludedCount > 0
        ) {
          matches.push({
            userId: criteriaData.userId,
            criteriaId,
            criteriaName: criteriaData.criteriaName,
          })
        }
      }

      if (matches.length > 0) {
        result.set(mangaId, matches)
      }
    }

    return result
  }

  async updateMatchStatistics(uniqueCriteriaIds: Set<number>): Promise<void> {
    if (uniqueCriteriaIds.size === 0) {
      return
    }

    await db
      .update(notificationCriteriaTable)
      .set({
        matchCount: sql`${notificationCriteriaTable.matchCount} + 1`,
        lastMatchedAt: new Date(),
      })
      .where(inArray(notificationCriteriaTable.id, Array.from(uniqueCriteriaIds)))
  }

  private extractNormalizedValues(metadata: MangaMetadata): Map<NotificationConditionType, Set<string>> {
    const valueMap = new Map<NotificationConditionType, Set<string>>()

    // Series
    if (metadata.series?.length) {
      valueMap.set(NotificationConditionType.SERIES, new Set(metadata.series.map((s) => this.normalizeValue(s))))
    }

    // Characters
    if (metadata.characters?.length) {
      valueMap.set(NotificationConditionType.CHARACTER, new Set(metadata.characters.map((c) => this.normalizeValue(c))))
    }

    // Tags
    if (metadata.tags?.length) {
      valueMap.set(NotificationConditionType.TAG, new Set(metadata.tags.map((t) => this.normalizeValue(t))))
    }

    // Artists
    if (metadata.artists?.length) {
      valueMap.set(NotificationConditionType.ARTIST, new Set(metadata.artists.map((a) => this.normalizeValue(a))))
    }

    // Groups
    if (metadata.groups?.length) {
      valueMap.set(NotificationConditionType.GROUP, new Set(metadata.groups.map((g) => this.normalizeValue(g))))
    }

    // Languages
    if (metadata.languages?.length) {
      valueMap.set(NotificationConditionType.LANGUAGE, new Set(metadata.languages.map((l) => this.normalizeValue(l))))
    }

    // Uploader
    if (metadata.uploader) {
      valueMap.set(NotificationConditionType.UPLOADER, new Set([metadata.uploader]))
    }

    return valueMap
  }

  private normalizeValue(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '_')
  }
}
