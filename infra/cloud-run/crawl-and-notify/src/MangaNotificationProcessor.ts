import { and, count, inArray, sql } from 'drizzle-orm'

import type { NotificationData } from '../../../src/database/type'
import type { Manga } from '../../../src/types/manga'

import { MAX_MANGA_TITLE_LENGTH, MAX_NOTIFICATION_COUNT } from '../../../src/constants/policy'
import { NotificationType } from '../../../src/database/enum'
import { db } from '../../../src/database/supabase/drizzle'
import { mangaSeenTable, notificationTable } from '../../../src/database/supabase/notification'
import { WebPushPayload, WebPushService } from '../../../src/lib/notification/WebPushService'
import { getViewerLink } from '../../../src/utils/manga'
import { OptimizedNotificationMatcher } from './OptimizedNotificationMatcher'

interface NewMangaNotification {
  artists?: string[]
  body: string
  mangaId: number
  previewImageURL: string
  title: string
  url: string
}

interface ProcessResult {
  errors: string[]
  matched: number
  notificationsSent: number
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

  async processBatches(mangaList: Manga[], { batchSize = 50 }: { batchSize?: number }): Promise<ProcessResult> {
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
    const mangaMap = new Map(mangaList.map((item) => [item.id, item]))
    const deduplicatedMangas = Array.from(mangaMap.values())

    try {
      const latestProcessedResult = await db
        .select({ mangaId: mangaSeenTable.mangaId })
        .from(mangaSeenTable)
        .orderBy(sql`${mangaSeenTable.mangaId} DESC`)
        .limit(1)

      const latestProcessedId = latestProcessedResult[0]?.mangaId || 0

      const newMangas = deduplicatedMangas
        .filter((item) => item.id > latestProcessedId)
        .map((item) => ({
          manga: item,
          metadata: this.matcher.convertMangaToMetadata(item),
        }))

      if (newMangas.length === 0) {
        return result
      }

      const mangaDataMap = new Map(newMangas.map((item) => [item.manga.id, item.manga]))
      const userNotificationsMap = new Map<number, NewMangaNotification[]>()
      const matchedCriteriaIds = new Set<number>()

      for (let i = 0; i < newMangas.length; i += batchSize) {
        const batch = newMangas.slice(i, i + batchSize)
        const metadataList = batch.map((item) => item.metadata)

        try {
          const matchedMangas = await this.matcher.findMatchingUsersWithCriteria(metadataList)

          if (!matchedMangas) {
            continue
          }

          for (const [mangaId, matches] of matchedMangas) {
            if (matches.length === 0) {
              continue
            }

            result.matched++
            const userMatches = new Map<number, { criteriaId: number; criteriaName: string }[]>()

            for (const match of matches) {
              const userMatch = userMatches.get(match.userId)
              matchedCriteriaIds.add(match.criteriaId)

              if (userMatch) {
                userMatch.push(match)
              } else {
                userMatches.set(match.userId, [match])
              }
            }

            const manga = mangaDataMap.get(mangaId)!

            for (const [userId, criteriaMatches] of userMatches) {
              const image = manga.images?.[0]
              const previewImageURL = image?.original?.url ?? image?.thumbnail?.url ?? ''
              const criteriaNames = criteriaMatches.map((c) => c.criteriaName).join(', ')
              const totalCount = criteriaMatches.length
              const userNotifications = userNotificationsMap.get(userId)

              const slicedTitle =
                manga.title.length > MAX_MANGA_TITLE_LENGTH
                  ? `${manga.title.slice(0, MAX_MANGA_TITLE_LENGTH - 3)}...`
                  : manga.title

              const newMangaNotification: NewMangaNotification = {
                title: slicedTitle || `작품 #${mangaId}`,
                body: criteriaNames.length > 25 ? `${criteriaNames.slice(0, 20)}... (${totalCount}개)` : criteriaNames,
                mangaId,
                previewImageURL,
                url: getViewerLink(mangaId),
                artists: manga.artists?.slice(0, 3).map((a) => a.value),
              }

              if (userNotifications) {
                userNotifications.push(newMangaNotification)
              } else {
                userNotificationsMap.set(userId, [newMangaNotification])
              }
            }
          }
        } catch (error) {
          result.errors.push(`Batch ${i / batchSize + 1} matching error: ${error}`)
        }
      }

      const processResult = await this.insertAndSendNotifications(userNotificationsMap)
      result.notificationsSent = processResult.notificationsSent
      result.errors.push(...processResult.errors)

      if (matchedCriteriaIds.size > 0) {
        try {
          await this.matcher.updateMatchStatistics(matchedCriteriaIds)
        } catch (error) {
          result.errors.push(`Failed to update match statistics: ${error}`)
        }
      }

      if (newMangas.length > 0) {
        const maxMangaId = Math.max(...newMangas.map((item) => item.manga.id))
        await db.insert(mangaSeenTable).values({ mangaId: maxMangaId })
      }

      return result
    } catch (error) {
      result.errors.push(`Error: ${error}`)
      return result
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Combined insert and cleanup operation in a single query
   *
   * 1. Inserts new notifications
   * 2. Removes notifications older than 30 days
   * 3. Keeps only the latest MAX_NOTIFICATION_COUNT per user
   */
  private async insertAndCleanupNotifications(
    notificationInserts: {
      userId: number
      type: number
      title: string
      body: string
      data: string
    }[],
    affectedUserIds: number[],
  ): Promise<void> {
    const values = notificationInserts.map((n) => sql`(${n.userId}, ${n.type}, ${n.title}, ${n.body}, ${n.data})`)
    const valuesQuery = sql.join(values, sql.raw(', '))

    await db.execute(sql`
      WITH inserted AS (
        INSERT INTO ${notificationTable} (user_id, type, title, body, data)
        VALUES ${valuesQuery}
      ),
      notifications_to_delete AS (
        SELECT id
        FROM (
          SELECT 
            ${notificationTable.id},
            ${notificationTable.userId},
            ${notificationTable.createdAt},
            ROW_NUMBER() OVER (
              PARTITION BY user_id 
              ORDER BY created_at DESC, id DESC
            ) as row_num
          FROM ${notificationTable}
          WHERE ${inArray(notificationTable.userId, affectedUserIds)}
        ) ranked_notifications
        WHERE 
          created_at < (NOW() - INTERVAL '30 days')
          OR row_num > ${MAX_NOTIFICATION_COUNT}
      )
      DELETE FROM ${notificationTable}
      WHERE id IN (SELECT id FROM notifications_to_delete)
    `)

    if (Math.random() < 0.01) {
      await db.execute(sql`
        DELETE FROM ${notificationTable}
        WHERE ${notificationTable.createdAt} < (NOW() - INTERVAL '30 days')
      `)
    }
  }

  /**
   * Process notifications for all users:
   * 1. Insert all notifications into database
   * 2. Send push notifications only to users with active subscriptions and appropriate settings
   *
   * NOTE(2025-08-06): 데이터베이스 요청 8번 (insert notifications, delete old, get settings, get daily counts, get subscriptions, update sentAt)
   */
  private async insertAndSendNotifications(userNotificationsMap: Map<number, NewMangaNotification[]>) {
    const result = {
      errors: [] as string[],
      notificationsSent: 0,
    }

    if (userNotificationsMap.size === 0) {
      return result
    }

    const allUserIds = Array.from(userNotificationsMap.keys())

    // Step 1: Insert all notifications into database for all users
    const allNotificationInserts: {
      userId: number
      type: number
      title: string
      body: string
      data: string
    }[] = []

    for (const [userId, mangaNotifications] of userNotificationsMap) {
      for (const notification of mangaNotifications) {
        allNotificationInserts.push({
          userId,
          type: NotificationType.NEW_MANGA,
          title: notification.title,
          body: notification.body,
          data: JSON.stringify({
            url: notification.url,
            artists: notification.artists,
            previewImageURL: notification.previewImageURL,
            mangaId: notification.mangaId,
          } satisfies NotificationData),
        })
      }
    }

    try {
      if (allNotificationInserts.length > 0) {
        await this.insertAndCleanupNotifications(allNotificationInserts, allUserIds)
      }
    } catch (error) {
      result.errors.push(`insertAndCleanupNotifications: ${error}`)
      return result
    }

    // Step 2: Determine which users should receive push notifications
    const userSettings = await this.notificationService.getPushSettingsOfUsers(allUserIds)

    if (!userSettings) {
      return result
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Get count of push notifications sent today (only those with sentAt set)
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

    // Step 3: Build list of push notifications to send
    const userWebPushes: { userId: number; payload: WebPushPayload }[] = []

    for (const [userId, mangaNotifications] of userNotificationsMap) {
      const settings = userSettings.get(userId)

      // Skip if user doesn't have push settings or quiet hours are active
      if (!settings || !this.shouldSendNotificationBasedOnSettings(settings)) {
        continue
      }

      // Check daily limit for push notifications
      const dailyCount = userDailyCounts.get(userId) || 0
      const remainingToday = settings.maxPerDay - dailyCount

      if (remainingToday <= 0) {
        continue
      }

      // Create push notifications for each manga, respecting daily limit
      let sentForUser = 0
      for (const notification of mangaNotifications) {
        if (sentForUser >= remainingToday) {
          break
        }

        userWebPushes.push({
          userId,
          payload: {
            title: notification.title,
            body: notification.body,
            data: { url: notification.url },
            icon: notification.previewImageURL,
            tag: `manga-${notification.mangaId}`,
            badge: '/badge.png',
          },
        })

        result.notificationsSent++
        sentForUser++
      }
    }

    if (userWebPushes.length === 0) {
      return result
    }

    // Step 4: Send push notifications (only to users with active subscriptions)
    try {
      await this.notificationService.sendWebPushesToUsers(userWebPushes)
      const sentUserIds = userWebPushes.map((wp) => wp.userId)

      await db
        .update(notificationTable)
        .set({ sentAt: new Date() })
        .where(
          and(
            inArray(notificationTable.userId, sentUserIds),
            sql`${notificationTable.sentAt} IS NULL`,
            sql`${notificationTable.createdAt} >= ${todayStart.toISOString()}`,
          ),
        )
    } catch (error) {
      result.errors.push(`Failed to send push notifications: ${error}`)
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
