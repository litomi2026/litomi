import { db } from '@litomi/db/app'
import { pushSettingsTable, webPushTable } from '@litomi/db/app/notification'
import { env as commonEnv } from '@litomi/env/server.common'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { PushSubscription } from 'web-push'
import webpush from 'web-push'

import { env } from './env'

const { APP_ORIGIN } = commonEnv
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = env

const WEB_PUSH_CONCURRENCY = 25
const vapidSubject = new URL(APP_ORIGIN)

if (vapidSubject.protocol !== 'https:') {
  if (vapidSubject.hostname !== 'localhost' && vapidSubject.hostname !== '127.0.0.1') {
    throw new Error('VAPID subject must be an HTTPS origin outside local development')
  }

  vapidSubject.protocol = 'https:'
}

webpush.setVapidDetails(vapidSubject.origin, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

export interface WebPushMessage {
  messageId?: number
  payload: WebPushPayload
  userId: number
}

interface PushSettings {
  maxPerDay: number
  quietEnabled: boolean
  quietHours: { start: number; end: number }
}

interface SendWebPushesResult {
  attemptedCount: number
  failed: WebPushFailure[]
  sentCount: number
  successfulMessageIds: number[]
}

interface WebPushFailure {
  error: string
  messageId?: number
  statusCode?: number
  userId: number
  webPushId: number
}

interface WebPushPayload {
  badge?: string
  body: string
  data?: { url?: string }
  icon?: string
  tag?: string
  title: string
}

export class WebPushService {
  private static instance: WebPushService

  static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService()
    }
    return WebPushService.instance
  }

  async getPushSettingsOfUsers(userIds: number[]): Promise<Map<number, PushSettings>> {
    if (userIds.length === 0) {
      return new Map()
    }

    const uniqueUserIds = Array.from(new Set(userIds))

    const settings = await db
      .select({
        userId: pushSettingsTable.userId,
        quietEnabled: pushSettingsTable.quietEnabled,
        quietStart: pushSettingsTable.quietStart,
        quietEnd: pushSettingsTable.quietEnd,
        maxDaily: pushSettingsTable.maxDaily,
      })
      .from(pushSettingsTable)
      .where(inArray(pushSettingsTable.userId, uniqueUserIds))

    const result = new Map<number, PushSettings>()

    for (const setting of settings) {
      result.set(setting.userId, {
        quietEnabled: setting.quietEnabled,
        quietHours: {
          start: setting.quietStart,
          end: setting.quietEnd,
        },
        maxPerDay: setting.maxDaily,
      })
    }

    for (const userId of uniqueUserIds) {
      if (!result.has(userId)) {
        result.set(userId, this.getDefaultPushSettings())
      }
    }

    return result
  }

  async registerPushSubscription(userId: number, subscription: PushSubscription, userAgent?: string) {
    const now = new Date()

    const [upsertedSubscription] = await db
      .insert(webPushTable)
      .values({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
        lastUsedAt: now,
      })
      .onConflictDoUpdate({
        target: webPushTable.endpoint,
        set: {
          userId,
          p256dh: sql`excluded.p256dh`,
          auth: sql`excluded.auth`,
          userAgent: sql`excluded.user_agent`,
          lastUsedAt: now,
        },
      })
      .returning()

    return upsertedSubscription
  }

  async sendTestWebPushToEndpoint(userId: number, endpoint: string, payload: WebPushPayload) {
    const [subscription] = await db
      .select({
        id: webPushTable.id,
        endpoint: webPushTable.endpoint,
        p256dh: webPushTable.p256dh,
        auth: webPushTable.auth,
      })
      .from(webPushTable)
      .where(and(eq(webPushTable.userId, userId), eq(webPushTable.endpoint, endpoint)))

    if (!subscription) {
      throw new Error('No push subscription found for this endpoint')
    }

    try {
      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      }

      const result = await webpush.sendNotification(pushSubscription, JSON.stringify(payload))
      await db.update(webPushTable).set({ lastUsedAt: new Date() }).where(eq(webPushTable.id, subscription.id))

      return result
    } catch (error) {
      const statusCode = getWebPushStatusCode(error)

      if (statusCode === 404 || statusCode === 410) {
        await db.delete(webPushTable).where(eq(webPushTable.id, subscription.id))
      }

      throw error
    }
  }

  async sendWebPushesToUsers(webPushes: WebPushMessage[]): Promise<SendWebPushesResult> {
    if (webPushes.length === 0) {
      return {
        attemptedCount: 0,
        failed: [],
        sentCount: 0,
        successfulMessageIds: [],
      }
    }

    const uniqueUserIds = Array.from(new Set(webPushes.map((n) => n.userId)))

    const subscriptions = await db
      .select({
        id: webPushTable.id,
        userId: webPushTable.userId,
        endpoint: webPushTable.endpoint,
        p256dh: webPushTable.p256dh,
        auth: webPushTable.auth,
      })
      .from(webPushTable)
      .where(inArray(webPushTable.userId, uniqueUserIds))

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

    const deliveryJobs: {
      message: WebPushMessage
      pushSubscription: PushSubscription
      webPushId: number
    }[] = []

    for (const message of webPushes) {
      const userSubscriptions = subscriptionsByUser.get(message.userId)

      if (!userSubscriptions) {
        continue
      }

      for (const sub of userSubscriptions) {
        deliveryJobs.push({
          message,
          webPushId: sub.id,
          pushSubscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
        })
      }
    }

    const sentMessageIds = new Set<number>()
    const successfulWebPushIds = new Set<number>()
    const expiredWebPushIds = new Set<number>()
    const failed: WebPushFailure[] = []
    let sentCount = 0

    for (let i = 0; i < deliveryJobs.length; i += WEB_PUSH_CONCURRENCY) {
      const deliveries = await Promise.all(
        deliveryJobs.slice(i, i + WEB_PUSH_CONCURRENCY).map(async (job) => {
          const base = {
            messageId: job.message.messageId,
            userId: job.message.userId,
            webPushId: job.webPushId,
          }

          try {
            await webpush.sendNotification(job.pushSubscription, JSON.stringify(job.message.payload))
            return { ...base, type: 'sent' as const }
          } catch (error) {
            const statusCode = getWebPushStatusCode(error)

            if (statusCode === 404 || statusCode === 410) {
              return { ...base, type: 'expired' as const }
            }

            return {
              ...base,
              type: 'failed' as const,
              statusCode,
              error: error instanceof Error ? error.message : String(error),
            }
          }
        }),
      )

      for (const delivery of deliveries) {
        if (delivery.type === 'sent') {
          sentCount += 1
          successfulWebPushIds.add(delivery.webPushId)

          if (typeof delivery.messageId === 'number') {
            sentMessageIds.add(delivery.messageId)
          }
        } else if (delivery.type === 'expired') {
          expiredWebPushIds.add(delivery.webPushId)
        } else {
          const { type: _, ...failure } = delivery
          failed.push(failure)
        }
      }
    }

    await Promise.all([
      successfulWebPushIds.size > 0 &&
        db
          .update(webPushTable)
          .set({ lastUsedAt: new Date() })
          .where(inArray(webPushTable.id, Array.from(successfulWebPushIds))),
      expiredWebPushIds.size > 0 &&
        db.delete(webPushTable).where(inArray(webPushTable.id, Array.from(expiredWebPushIds))),
    ])

    return {
      attemptedCount: deliveryJobs.length,
      failed,
      sentCount,
      successfulMessageIds: Array.from(sentMessageIds),
    }
  }

  async unsubscribeUser(userId: number, endpoint?: string) {
    if (endpoint) {
      await db.delete(webPushTable).where(and(eq(webPushTable.userId, userId), eq(webPushTable.endpoint, endpoint)))
    } else {
      await db.delete(webPushTable).where(eq(webPushTable.userId, userId))
    }
  }

  private getDefaultPushSettings(): PushSettings {
    return {
      maxPerDay: 10,
      quietEnabled: true,
      quietHours: { start: 22, end: 7 },
    }
  }
}

function getWebPushStatusCode(error: unknown) {
  if (error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode
  }
}
