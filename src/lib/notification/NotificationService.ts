import { and, count, eq, sql } from 'drizzle-orm'
import webpush, { PushSubscription } from 'web-push'

import { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } from '@/constants/env'
import { db } from '@/database/drizzle'
import { NotificationType } from '@/database/enum'
import {
  // bookmarkTable,
  // mangaCrawlHistoryTable,
  notificationTable,
  pushSettingsTable,
  webPushTable,
} from '@/database/schema'

// import { type MangaMetadata, optimizedNotificationMatcher } from './OptimizedNotificationMatcher'

// Configure web-push
webpush.setVapidDetails('mailto:notification@litomi.in', NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export interface NotificationPayload {
  badge?: string
  body: string
  data?: {
    mangaId?: number
    source?: string
    url?: string
    timestamp?: number
    notificationType?: 'bookmark' | 'keyword'
  }
  icon?: string
  tag?: string
  title: string
}

export class NotificationService {
  private static instance: NotificationService

  // NOTE: 싱글톤 패턴
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Check for new manga and notify users using both bookmark and keyword matching
   */
  // async checkAndNotifyNewManga(mangaId: number, source: number, mangaMetadata?: MangaMetadata) {
  //   // Check if this is a new manga
  //   const existingHistory = await db
  //     .select()
  //     .from(mangaCrawlHistoryTable)
  //     .where(and(eq(mangaCrawlHistoryTable.mangaId, mangaId), eq(mangaCrawlHistoryTable.source, source)))
  //     .limit(1)

  //   const isNewManga = existingHistory.length === 0

  //   // Update or insert crawl history
  //   if (isNewManga) {
  //     await db.insert(mangaCrawlHistoryTable).values({
  //       mangaId,
  //       source,
  //     })
  //   } else {
  //     await db
  //       .update(mangaCrawlHistoryTable)
  //       .set({
  //         lastSeenAt: new Date(),
  //         updateCount: sql`${mangaCrawlHistoryTable.updateCount} + 1`,
  //       })
  //       .where(and(eq(mangaCrawlHistoryTable.mangaId, mangaId), eq(mangaCrawlHistoryTable.source, source)))
  //   }

  //   // Only notify for new manga
  //   if (!isNewManga) return

  //   // Collect users to notify
  //   const usersToNotify = new Map<number, { type: 'bookmark' | 'keyword'; criteriaName?: string }>()

  //   // 1. Find users who bookmarked this manga
  //   const bookmarks = await db
  //     .select({
  //       userId: bookmarkTable.userId,
  //     })
  //     .from(bookmarkTable)
  //     .where(and(eq(bookmarkTable.mangaId, mangaId), eq(bookmarkTable.source, source)))

  //   bookmarks.forEach((bookmark) => {
  //     usersToNotify.set(bookmark.userId, { type: 'bookmark' })
  //   })

  //   // 2. Find users who have keyword criteria matching this manga (if metadata provided)
  //   if (mangaMetadata) {
  //     const criteriaMatches = await optimizedNotificationMatcher.findMatchingUsersWithCriteria(mangaMetadata)

  //     criteriaMatches.forEach((match) => {
  //       // If user already bookmarked, prefer bookmark notification
  //       if (!usersToNotify.has(match.userId)) {
  //         usersToNotify.set(match.userId, {
  //           type: 'keyword',
  //           criteriaName: match.criteriaName,
  //         })
  //       }
  //     })
  //   }

  //   // Send notifications to each user
  //   const notificationPromises = Array.from(usersToNotify.entries()).map(async ([userId, notifInfo]) => {
  //     const payload: NotificationPayload = {
  //       title:
  //         notifInfo.type === 'bookmark' ? '북마크한 만화가 업데이트되었습니다!' : '관심 키워드 만화가 등록되었습니다!',
  //       body:
  //         notifInfo.type === 'bookmark'
  //           ? `북마크한 시리즈에 새로운 만화가 추가되었습니다.`
  //           : `"${notifInfo.criteriaName}" 조건에 맞는 새로운 만화가 등록되었습니다.`,
  //       icon: '/icon.png',
  //       badge: '/badge.png',
  //       tag: `manga-${mangaId}`,
  //       data: {
  //         mangaId,
  //         source: source.toString(),
  //         url: `/manga/${mangaId}/${source}`,
  //         timestamp: Date.now(),
  //         notificationType: notifInfo.type,
  //       },
  //     }

  //     return this.sendNotificationToUser(userId.toString(), payload)
  //   })

  //   await Promise.allSettled(notificationPromises)
  // }

  /**
   * Get user's notification preferences
   */
  async getUserNotificationSettings(userId: string) {
    try {
      const [settings] = await db
        .select()
        .from(pushSettingsTable)
        .where(eq(pushSettingsTable.userId, Number(userId)))
        .limit(1)

      if (!settings) {
        // Return default settings
        return {
          quietHours: { start: 22, end: 7 },
          maxPerDay: 10,
          batchUpdates: true,
          notificationTypes: ['new_manga', 'bookmark_update'],
        }
      }

      return {
        quietHours: {
          start: settings.quietStart,
          end: settings.quietEnd,
        },
        maxPerDay: settings.maxDaily,
        batchUpdates: settings.batchEnabled,
        notificationTypes: ['new_manga', 'bookmark_update'], // This could be moved to a separate table in the future
      }
    } catch (error) {
      console.error('Failed to get user notification settings:', error)
      // Return default settings on error
      return {
        enabled: true,
        quietHours: { start: 22, end: 7 },
        maxPerDay: 10,
        batchUpdates: true,
        notificationTypes: ['new_manga', 'bookmark_update'],
      }
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId: string, payload: NotificationPayload) {
    const subscriptions = await db
      .select()
      .from(webPushTable)
      .where(sql`${webPushTable.userId} = ${userId}`)

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`)
      return
    }

    // Save notification to database
    const [notification] = await db
      .insert(notificationTable)
      .values({
        userId: Number(userId),
        type: NotificationType.NEW_MANGA,
        title: payload.title,
        body: payload.body,
        data: payload.data ? JSON.stringify(payload.data) : null,
      })
      .returning()

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          const result = await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              ...payload,
              notificationId: notification.id,
            }),
          )

          // Update last used timestamp
          await db.update(webPushTable).set({ lastUsedAt: new Date() }).where(eq(webPushTable.id, sub.id))

          return result
        } catch (error) {
          // Handle expired subscriptions
          if (error instanceof Error && 'statusCode' in error && error.statusCode === 410) {
            await db.delete(webPushTable).where(eq(webPushTable.id, sub.id))
          }
          throw error
        }
      }),
    )

    // Update notification sent timestamp
    await db.update(notificationTable).set({ sentAt: new Date() }).where(eq(notificationTable.id, notification.id))

    return results
  }

  /**
   * Send notification to specific endpoint
   */
  async sendTestPushToEndpoint(userId: string, endpoint: string, payload: NotificationPayload) {
    const subscription = await db
      .select()
      .from(webPushTable)
      .where(and(eq(webPushTable.userId, Number(userId)), eq(webPushTable.endpoint, endpoint)))
      .limit(1)

    if (subscription.length === 0) {
      throw new Error('No push subscription found for this endpoint')
    }

    const sub = subscription[0]
    const pushSubscription: PushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    }

    try {
      const result = await webpush.sendNotification(pushSubscription, JSON.stringify(payload))

      // Update last used timestamp
      await db.update(webPushTable).set({ lastUsedAt: new Date() }).where(eq(webPushTable.id, sub.id))

      return result
    } catch (error) {
      // Handle expired subscriptions
      if (error instanceof Error && 'statusCode' in error && error.statusCode === 410) {
        await db.delete(webPushTable).where(eq(webPushTable.id, sub.id))
      }
      throw error
    }
  }

  /**
   * Check if notification should be sent based on user preferences
   */
  async shouldSendNotification(userId: string): Promise<boolean> {
    const settings = await this.getUserNotificationSettings(userId)

    if (!settings.enabled) {
      return false
    }

    if (settings.quietHours) {
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

    // Check daily limit
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayNotifications = await db
      .select({ count: count() })
      .from(notificationTable)
      .where(sql`${notificationTable.userId} = ${userId} AND ${notificationTable.sentAt} >= ${todayStart}`)

    if (todayNotifications[0].count >= settings.maxPerDay) {
      return false
    }

    return true
  }

  async subscribeUser(userId: string, subscription: PushSubscription, userAgent?: string) {
    const [upsertedSubscription] = await db
      .insert(webPushTable)
      .values({
        userId: Number(userId),
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [webPushTable.userId, webPushTable.endpoint],
        set: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          lastUsedAt: new Date(),
        },
      })
      .returning()

    return upsertedSubscription
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(userId: number, endpoint?: string) {
    if (endpoint) {
      await db.delete(webPushTable).where(and(eq(webPushTable.userId, userId), eq(webPushTable.endpoint, endpoint)))
    } else {
      // Remove all subscriptions for user
      await db.delete(webPushTable).where(eq(webPushTable.userId, userId))
    }
  }
}
