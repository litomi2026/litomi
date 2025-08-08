import { and, eq, inArray, type InferInsertModel, sql } from 'drizzle-orm'
import webpush, { PushSubscription } from 'web-push'

import { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } from '@/constants/env'
import { CANONICAL_URL } from '@/constants/url'
import { db } from '@/database/drizzle'
import { BookmarkSource } from '@/database/enum'
import { notificationTable, pushSettingsTable, webPushTable } from '@/database/schema'

webpush.setVapidDetails(CANONICAL_URL, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export interface WebPushPayload {
  badge?: string
  body: string
  data?: {
    mangaId?: number
    source?: BookmarkSource
    url?: string
    timestamp?: number
    notificationType?: 'bookmark' | 'keyword' | 'new_manga'
  }
  icon?: string
  tag?: string
  title: string
}

interface PushSettings {
  batchUpdates: boolean
  maxPerDay: number
  notificationTypes: string[]
  quietEnabled: boolean
  quietHours: { start: number; end: number }
}

export class WebPushService {
  private static instance: WebPushService

  static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService()
    }
    return WebPushService.instance
  }

  async getUsersPushSettings(userIds: number[]) {
    if (userIds.length === 0) {
      return
    }

    const settings = await db.select().from(pushSettingsTable).where(inArray(pushSettingsTable.userId, userIds))
    const result = new Map<number, PushSettings>()

    for (const setting of settings) {
      result.set(setting.userId, {
        quietEnabled: setting.quietEnabled,
        quietHours: {
          start: setting.quietStart,
          end: setting.quietEnd,
        },
        maxPerDay: setting.maxDaily,
        batchUpdates: setting.batchEnabled,
        notificationTypes: ['new_manga', 'bookmark_update'],
      })
    }

    for (const userId of userIds) {
      if (!result.has(userId)) {
        result.set(userId, this.getDefaultPushSettings())
      }
    }

    return result
  }

  async sendTestWebPushToEndpoint(userId: string, endpoint: string, payload: WebPushPayload) {
    const [subscription] = await db
      .select()
      .from(webPushTable)
      .where(and(sql`${webPushTable.userId} = ${userId}`, eq(webPushTable.endpoint, endpoint)))

    if (!subscription) {
      throw new Error('No push subscription found for this endpoint')
    }

    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    try {
      const result = await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
      await db.update(webPushTable).set({ lastUsedAt: new Date() }).where(eq(webPushTable.id, subscription.id))
      return result
    } catch (error) {
      // Handle expired subscriptions
      if (error instanceof Error && 'statusCode' in error && error.statusCode === 410) {
        await db.delete(webPushTable).where(eq(webPushTable.id, subscription.id))
      }
      throw error
    }
  }

  /**
   * NOTE(2025-08-06): 데이터베이스 요청 5번
   */
  async sendWebPushesToUsers<TWebPush extends { userId: number; payload: WebPushPayload }>(
    webPushes: TWebPush[],
    convertToNotification: (
      webPush: TWebPush,
    ) => Omit<InferInsertModel<typeof notificationTable>, 'createdAt' | 'sentAt'>,
  ) {
    if (webPushes.length === 0) {
      return
    }

    const userIds = webPushes.map((n) => n.userId)
    const notificationInserts = webPushes.map(convertToNotification)

    const [subscriptions, insertedNotifications] = await Promise.all([
      db
        .select({
          id: webPushTable.id,
          userId: webPushTable.userId,
          endpoint: webPushTable.endpoint,
          p256dh: webPushTable.p256dh,
          auth: webPushTable.auth,
        })
        .from(webPushTable)
        .where(inArray(webPushTable.userId, userIds)),
      db.insert(notificationTable).values(notificationInserts).returning({
        id: notificationTable.id,
        userId: notificationTable.userId,
      }),
      db.delete(notificationTable).where(sql`${notificationTable.createdAt} < NOW() - INTERVAL '30 days'`),
    ])

    const subscriptionsByUser = new Map<number, typeof subscriptions>()

    for (const subscription of subscriptions) {
      const userId = subscription.userId
      const userSubscriptions = subscriptionsByUser.get(userId)
      if (userSubscriptions) {
        userSubscriptions.push(subscription)
      } else {
        subscriptionsByUser.set(userId, [subscription])
      }
    }

    const notificationIdMap = new Map(insertedNotifications.map(({ userId, id }) => [userId, id]))
    const pushPromises = []
    const successfulWebPushIds: number[] = []
    const successfulNotificationIds: number[] = []
    const expiredWebPushIds: number[] = []

    for (const { userId, payload } of webPushes) {
      const userSubscriptions = subscriptionsByUser.get(userId)

      if (!userSubscriptions || userSubscriptions.length === 0) {
        continue
      }

      const notificationId = notificationIdMap.get(userId) ?? 0

      for (const sub of userSubscriptions) {
        const pushSubscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        pushPromises.push(
          webpush
            .sendNotification(
              pushSubscription,
              JSON.stringify({
                ...payload,
                ...(notificationId && { notificationId }),
              }),
            )
            .then(() => {
              successfulWebPushIds.push(sub.id)
              successfulNotificationIds.push(notificationId)
            })
            .catch((error) => {
              if (error instanceof Error && 'statusCode' in error && error.statusCode === 410) {
                expiredWebPushIds.push(sub.id)
              } else {
                console.error(`Failed to send push notification: ${error}`)
              }
            }),
        )
      }
    }

    await Promise.all(pushPromises)

    await Promise.all([
      successfulWebPushIds.length > 0 &&
        db.update(webPushTable).set({ lastUsedAt: new Date() }).where(inArray(webPushTable.id, successfulWebPushIds)),
      successfulNotificationIds.length > 0 &&
        db
          .update(notificationTable)
          .set({ sentAt: new Date() })
          .where(inArray(notificationTable.id, successfulNotificationIds)),
      expiredWebPushIds.length > 0 && db.delete(webPushTable).where(inArray(webPushTable.id, expiredWebPushIds)),
    ])
  }

  async subscribeUser(userId: number, subscription: PushSubscription, userAgent?: string) {
    const [upsertedSubscription] = await db
      .insert(webPushTable)
      .values({
        userId: userId,
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

  async unsubscribeUser(userId: string, endpoint?: string) {
    if (endpoint) {
      await db
        .delete(webPushTable)
        .where(and(sql`${webPushTable.userId} = ${userId}`, eq(webPushTable.endpoint, endpoint)))
    } else {
      await db.delete(webPushTable).where(sql`${webPushTable.userId} = ${userId}`)
    }
  }

  private getDefaultPushSettings(): PushSettings {
    return {
      batchUpdates: true,
      maxPerDay: 10,
      notificationTypes: ['new_manga', 'bookmark_update'],
      quietEnabled: true,
      quietHours: { start: 22, end: 7 },
    }
  }
}
