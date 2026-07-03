import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { webhookEventTable } from '../schema/payment'

export async function wasWebhookEventProcessed(eventId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: webhookEventTable.id })
    .from(webhookEventTable)
    .where(and(eq(webhookEventTable.provider, 'portone'), eq(webhookEventTable.eventId, eventId)))

  return row !== undefined
}

export interface RecordWebhookEventInput {
  eventId: string
  type: string
  payload: string
}

export async function recordWebhookEvent(input: RecordWebhookEventInput): Promise<void> {
  await db
    .insert(webhookEventTable)
    .values({
      eventId: input.eventId,
      type: input.type.slice(0, 64),
      payload: input.payload.slice(0, 4096),
    })
    .onConflictDoNothing({ target: [webhookEventTable.provider, webhookEventTable.eventId] })
}
