import { db } from '@litomi/db/app'
import { mangaSeenTable, notificationTable } from '@litomi/db/app/notification'
import { anyOf } from '@litomi/db/sql'
import type { Manga } from '@litomi/domain/manga/model'
import { MANGA_TITLE_MAX_LENGTH } from '@litomi/domain/manga/policy'
import type { NotificationData } from '@litomi/domain/notification/model'
import { NotificationType } from '@litomi/domain/notification/model'
import { MAX_NOTIFICATION_COUNT } from '@litomi/domain/notification/policy'
import { getViewerLink } from '@litomi/domain/utils/manga'
import { isWithinQuietHours, type WebPushMessage, WebPushService } from '@litomi/notifications'
import { and, count, desc, gte, isNull, sql } from 'drizzle-orm'

import { OptimizedNotificationMatcher } from './OptimizedNotificationMatcher'

interface InsertedNotificationForPush {
  body: string
  data: string | null
  id: number
  title: string
  userId: number
}

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
        .orderBy(desc(mangaSeenTable.mangaId))
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
                manga.title.length > MANGA_TITLE_MAX_LENGTH
                  ? `${manga.title.slice(0, MANGA_TITLE_MAX_LENGTH - 3)}...`
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

  private async insertAndCleanupNotifications(
    notificationInserts: {
      userId: number
      type: number
      title: string
      body: string
      data: string
    }[],
    affectedUserIds: number[],
  ): Promise<InsertedNotificationForPush[]> {
    return db.transaction(async (tx) => {
      const insertedNotifications = await tx.insert(notificationTable).values(notificationInserts).returning({
        id: notificationTable.id,
        userId: notificationTable.userId,
        title: notificationTable.title,
        body: notificationTable.body,
        data: notificationTable.data,
      })

      const deletedRows = await tx.execute<{ id: number | string }>(sql`
        WITH notifications_to_delete AS (
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
            WHERE ${anyOf(notificationTable.userId, affectedUserIds)}
          ) ranked_notifications
          WHERE
            created_at < (NOW() - INTERVAL '30 days')
            OR row_num > ${MAX_NOTIFICATION_COUNT}
        )
        DELETE FROM ${notificationTable}
        WHERE id IN (SELECT id FROM notifications_to_delete)
        RETURNING ${notificationTable.id} AS id
      `)

      if (Math.random() < 0.01) {
        await tx.execute(sql`
          DELETE FROM ${notificationTable}
          WHERE ${notificationTable.createdAt} < (NOW() - INTERVAL '30 days')
        `)
      }

      const deletedIds = new Set(deletedRows.map((row) => Number(row.id)))

      return insertedNotifications.filter((notification) => !deletedIds.has(notification.id))
    })
  }

  private async insertAndSendNotifications(userNotificationsMap: Map<number, NewMangaNotification[]>) {
    const result = {
      errors: [] as string[],
      notificationsSent: 0,
    }

    if (userNotificationsMap.size === 0) {
      return result
    }

    const allUserIds = Array.from(userNotificationsMap.keys())

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

    let insertedNotifications: InsertedNotificationForPush[] = []

    try {
      if (allNotificationInserts.length > 0) {
        insertedNotifications = await this.insertAndCleanupNotifications(allNotificationInserts, allUserIds)
      }

      if (insertedNotifications.length === 0) {
        return result
      }
    } catch (error) {
      result.errors.push(`insertAndCleanupNotifications: ${error}`)
      return result
    }

    const userSettings = await this.notificationService.getPushSettingsOfUsers(allUserIds)

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setUTCHours(0, 0, 0, 0)

    const dailyCounts = await db
      .select({
        userId: notificationTable.userId,
        count: count(),
      })
      .from(notificationTable)
      .where(and(anyOf(notificationTable.userId, allUserIds), gte(notificationTable.sentAt, todayStart)))
      .groupBy(notificationTable.userId)

    const userDailyCounts = new Map(dailyCounts.map((row) => [row.userId, row.count]))
    const userWebPushes: WebPushMessage[] = []
    const pendingCountsByUser = new Map<number, number>()

    for (const notification of insertedNotifications) {
      const settings = userSettings.get(notification.userId)!

      if (isWithinQuietHours(settings, now)) {
        continue
      }

      const dailyCount = userDailyCounts.get(notification.userId) || 0
      const pendingCount = pendingCountsByUser.get(notification.userId) || 0
      const remainingToday = settings.maxPerDay - dailyCount - pendingCount

      if (remainingToday <= 0) {
        continue
      }

      const data = JSON.parse(notification.data!) as NotificationData

      userWebPushes.push({
        messageId: notification.id,
        userId: notification.userId,
        payload: {
          title: notification.title,
          body: notification.body,
          data: { url: data.url },
          icon: data.previewImageURL,
          tag: data.mangaId ? `manga-${data.mangaId}` : undefined,
          badge: '/badge.png',
        },
      })

      pendingCountsByUser.set(notification.userId, pendingCount + 1)
    }

    if (userWebPushes.length === 0) {
      return result
    }

    try {
      const sendResult = await this.notificationService.sendWebPushesToUsers(userWebPushes)
      const sentNotificationIds = sendResult.successfulMessageIds
      result.notificationsSent = sentNotificationIds.length

      if (sentNotificationIds.length > 0) {
        await db
          .update(notificationTable)
          .set({ sentAt: new Date() })
          .where(and(anyOf(notificationTable.id, sentNotificationIds), isNull(notificationTable.sentAt)))
      }

      if (sendResult.failed.length > 0) {
        result.errors.push(`Failed web push deliveries: ${sendResult.failed.length}/${sendResult.attemptedCount}`)
      }
    } catch (error) {
      result.errors.push(`Failed to send push notifications: ${error}`)
    }

    return result
  }
}
