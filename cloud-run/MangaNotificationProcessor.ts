import { and, count, inArray, sql } from 'drizzle-orm'

import type { Manga } from '../src/types/manga'

import { db } from '../src/database/drizzle'
import { BookmarkSource, NotificationType } from '../src/database/enum'
import { mangaSeenTable } from '../src/database/notification-schema'
import { notificationTable } from '../src/database/schema'
import { OptimizedNotificationMatcher } from '../src/lib/notification/OptimizedNotificationMatcher'
import { WebPushService } from '../src/lib/notification/WebPushService'
import { getImageSrc, getViewerLink } from '../src/utils/manga'
import { mapBookmarkSourceToSourceParam } from '../src/utils/param'

interface CriteriaMatch {
  id: number
  name: string
}

interface ProcessResult {
  errors: string[]
  matched: number
  notificationsSent: number
}

interface UserMangaNotification {
  criteriaMatches: CriteriaMatch[]
  mangaArtists?: string[]
  mangaId: number
  mangaTitle?: string
  previewImageUrl?: string
  source: BookmarkSource
}

export class MangaNotificationProcessor {
  private static instance: MangaNotificationProcessor
  private isProcessing = false
  private matcher: OptimizedNotificationMatcher
  private notificationService: WebPushService

  private constructor() {
    this.matcher = OptimizedNotificationMatcher.getInstance()
    this.notificationService = WebPushService.getInstance()
  }

  static getInstance(): MangaNotificationProcessor {
    if (!MangaNotificationProcessor.instance) {
      MangaNotificationProcessor.instance = new MangaNotificationProcessor()
    }
    return MangaNotificationProcessor.instance
  }

  async processBatches(
    mangaList: { manga: Manga; source: BookmarkSource }[],
    { batchSize = 50 }: { batchSize?: number },
  ): Promise<ProcessResult> {
    const result: ProcessResult = {
      matched: 0,
      notificationsSent: 0,
      errors: [],
    }

    if (mangaList.length === 0) {
      return result
    }

    if (this.isProcessing) {
      return {
        matched: 0,
        notificationsSent: 0,
        errors: ['Another processing job is already running'],
      }
    }

    this.isProcessing = true
    const mangaMap = new Map(mangaList.map((item) => [item.manga.id, item]))
    const deduplicatedMangas = Array.from(mangaMap.values())
    const uniqueMangaIds = Array.from(mangaMap.keys())

    try {
      const existingManga = await db
        .select({ mangaId: mangaSeenTable.mangaId })
        .from(mangaSeenTable)
        .where(inArray(mangaSeenTable.mangaId, uniqueMangaIds))

      const existingSet = new Set(existingManga.map((m) => m.mangaId))

      const newMangas = deduplicatedMangas
        .filter((item) => !existingSet.has(item.manga.id))
        .map((item) => ({
          manga: item.manga,
          source: item.source,
          metadata: this.matcher.convertMangaToMetadata(item.manga),
        }))

      if (newMangas.length === 0) {
        return result
      }

      const mangaSourceMap = new Map(newMangas.map((item) => [item.manga.id, item.source]))
      const mangaDataMap = new Map(newMangas.map((item) => [item.manga.id, item.manga]))
      const allUserNotificationsMap = new Map<number, UserMangaNotification[]>()

      for (let i = 0; i < newMangas.length; i += batchSize) {
        const batch = newMangas.slice(i, i + batchSize)
        const metadataList = batch.map((item) => item.metadata)

        try {
          const matchedMangas = await this.matcher.findMatchingUsersWithCriteria(metadataList)

          for (const [mangaId, matches] of matchedMangas || []) {
            if (matches.length === 0) {
              continue
            }

            result.matched++
            const userMatches = new Map<number, { criteriaId: number; criteriaName: string }[]>()

            for (const match of matches) {
              const userMatch = userMatches.get(match.userId)

              if (userMatch) {
                userMatch.push(match)
              } else {
                userMatches.set(match.userId, [match])
              }
            }

            const source = mangaSourceMap.get(mangaId)!
            const manga = mangaDataMap.get(mangaId)!

            for (const [userId, criteriaMatches] of userMatches) {
              const userNotifications = allUserNotificationsMap.get(userId)

              const previewImageUrl = manga.images?.[0]
                ? getImageSrc({ cdn: manga.cdn, path: manga.images[0] })
                : undefined

              const newNotification = {
                criteriaMatches: criteriaMatches.map((c) => ({ id: c.criteriaId, name: c.criteriaName })),
                mangaId,
                source,
                mangaTitle: manga.title,
                mangaArtists: manga.artists?.map((a) => a.value),
                previewImageUrl,
              }

              if (userNotifications) {
                userNotifications.push(newNotification)
              } else {
                allUserNotificationsMap.set(userId, [newNotification])
              }
            }
          }
        } catch (error) {
          result.errors.push(`Batch ${i / batchSize + 1} matching error: ${error}`)
        }
      }

      const processResult = await this.processAllUserNotifications(allUserNotificationsMap)
      result.notificationsSent = processResult.notificationsSent
      result.errors.push(...processResult.errors)

      await db.insert(mangaSeenTable).values(newMangas.map((item) => ({ mangaId: item.manga.id })))

      return result
    } catch (error) {
      result.errors.push(`Error: ${error}`)
      return result
    } finally {
      this.isProcessing = false
    }
  }

  private createNotificationPayload(notification: UserMangaNotification) {
    const notificationTitle = notification.mangaTitle || `만화 #${notification.mangaId}`
    const names = notification.criteriaMatches.map((c) => c.name).join(', ')
    const totalCount = notification.criteriaMatches.length
    const notificationBody = names.length > 25 ? `${names.slice(0, 20)}... (${totalCount}개)` : names
    const sourceParam = mapBookmarkSourceToSourceParam(notification.source)
    const mangaUrl = getViewerLink(notification.mangaId, sourceParam)

    return {
      title: notificationTitle,
      body: notificationBody,
      data: {
        ...notification,
        url: mangaUrl,
        notificationType: 'new_manga' as const,
      },
      icon: notification.previewImageUrl || '/icon.png',
      badge: '/badge.png',
      tag: `manga-${notification.mangaId}`,
    }
  }

  /**
   * NOTE(2025-08-06): 데이터베이스 요청 7번
   */
  private async processAllUserNotifications(userNotificationsMap: Map<number, UserMangaNotification[]>) {
    const result = {
      errors: [] as string[],
      notificationsSent: 0,
    }

    if (userNotificationsMap.size === 0) {
      return result
    }

    const allUserIds = Array.from(userNotificationsMap.keys())
    const userSettings = await this.notificationService.getUsersPushSettings(allUserIds)

    if (!userSettings) {
      return result
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const dailyCounts = await db
      .select({
        userId: notificationTable.userId,
        count: count(),
      })
      .from(notificationTable)
      .where(
        and(
          inArray(notificationTable.userId, allUserIds),
          sql`${notificationTable.sentAt} >= ${todayStart.toISOString()}`,
        ),
      )
      .groupBy(notificationTable.userId)

    const userDailyCounts = new Map(dailyCounts.map((row) => [row.userId, row.count]))
    const webPushes: {
      userId: number
      payload: ReturnType<MangaNotificationProcessor['createNotificationPayload']>
    }[] = []

    for (const [userId, mangaNotifications] of userNotificationsMap) {
      // Check if user should receive notifications
      const settings = userSettings.get(userId)
      if (!settings || !this.shouldSendNotificationBasedOnSettings(settings)) {
        continue
      }

      // Check daily limit
      const dailyCount = userDailyCounts.get(userId) || 0
      const remainingToday = settings.maxPerDay - dailyCount

      if (remainingToday <= 0) {
        continue
      }

      // Create notifications for each manga, respecting daily limit
      let sentForUser = 0
      for (const notification of mangaNotifications) {
        // Stop if we've reached the daily limit for this user
        if (sentForUser >= remainingToday) {
          break
        }

        webPushes.push({
          userId,
          payload: this.createNotificationPayload(notification),
        })

        result.notificationsSent++
        sentForUser++
      }
    }

    try {
      await this.notificationService.sendWebPushesToUsers(webPushes, ({ userId, payload }) => ({
        userId,
        type: NotificationType.NEW_MANGA,
        title: payload.title,
        body: payload.body,
        data: JSON.stringify(payload.data),
      }))
    } catch (error) {
      result.errors.push(`Failed to batch send push notifications: ${error}`)
    }

    return result
  }

  /**
   * Check if notification should be sent based on user settings
   */
  private shouldSendNotificationBasedOnSettings(settings: {
    quietEnabled: boolean
    quietHours: { start: number; end: number }
  }): boolean {
    if (settings.quietEnabled && settings.quietHours) {
      const { start, end } = settings.quietHours
      const currentHour = new Date().getHours()

      if (start > end) {
        if (currentHour >= start || currentHour < end) {
          return false
        }
      } else {
        if (currentHour >= start && currentHour < end) {
          return false
        }
      }
    }

    return true
  }
}
