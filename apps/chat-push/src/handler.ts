import { listActiveSubscriberUserIds, SUBSCRIBER_PAGE_SIZE } from '@litomi/db/app/query/chat'
import { type ChatPushFanoutEvent, type ChatPushPayload, publishPushFanout } from '@litomi/events'
import { isWithinQuietHours, type WebPushMessage, WebPushService } from '@litomi/notifications'

const webPush = WebPushService.getInstance()

// Consumes push fan-out jobs. A broadcast job is ONE keyset page of subscribers that
// re-enqueues its successor, so each invocation is bounded work; a reply is a single push.
// Throwing triggers a Kafka retry (at-least-once); duplicate deliveries are collapsed on
// the device by the payload `tag`, so we optimize for never DROPPING a recipient.
export async function processPushFanout(event: ChatPushFanoutEvent): Promise<void> {
  if (event.kind === 'reply') {
    await deliver([event.recipientUserId], event.payload)
  } else if (event.kind === 'broadcast') {
    await processBroadcastPage(event)
  }
}

async function processBroadcastPage(event: Extract<ChatPushFanoutEvent, { kind: 'broadcast' }>): Promise<void> {
  const userIds = await listActiveSubscriberUserIds(event.artistId, {
    afterUserId: event.afterUserId,
    limit: SUBSCRIBER_PAGE_SIZE,
  })

  if (userIds.length === 0) {
    return
  }

  // Deliver THIS page first, then advance the chain. A crash/rebalance therefore re-delivers
  // (deduped on-device by `tag`) instead of skipping recipients; the continuation only ever
  // forks if the failure lands in the tiny enqueue→commit window.
  const recipientIds = userIds.filter((userId) => userId !== event.excludeUserId)
  await deliver(recipientIds, event.payload)

  // A full page means more may remain — hand the next page to a fresh job. The cursor is the
  // last id of the UNFILTERED page so a fully-excluded page still advances.
  if (userIds.length === SUBSCRIBER_PAGE_SIZE) {
    await publishPushFanout({ ...event, afterUserId: userIds[userIds.length - 1] })
  }
}

async function deliver(userIds: number[], payload: ChatPushPayload): Promise<void> {
  await webPush.sendWebPushesToUsers(await buildDeliverableMessages(userIds, payload))
}

// Drops recipients currently inside their quiet-hours window and maps the wire payload to
// the web-push shape (click target lives under `data.url`). maxDaily is intentionally not
// applied: chat is human-authored, so a real message is never withheld for a notification cap.
async function buildDeliverableMessages(userIds: number[], payload: ChatPushPayload): Promise<WebPushMessage[]> {
  if (userIds.length === 0) {
    return []
  }

  const settings = await webPush.getPushSettingsOfUsers(userIds)
  const now = new Date()

  return userIds
    .filter((userId) => !isWithinQuietHours(settings.get(userId)!, now))
    .map((userId) => ({
      userId,
      payload: {
        title: payload.title,
        body: payload.body,
        tag: payload.tag,
        data: { url: payload.url },
        ...(payload.icon && { icon: payload.icon }),
      },
    }))
}
