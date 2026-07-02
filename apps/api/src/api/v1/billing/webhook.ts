import { getRemotePayment, isWebhookConfigured, verifyBillingWebhook } from '@litomi/billing'
import { getPaymentByPaymentId } from '@litomi/db/app/query/payment'
import { markPaymentMethodDeletedByToken } from '@litomi/db/app/query/payment-method'
import { applyPaymentRefunds } from '@litomi/db/app/query/refund'
import { confirmPayment } from '@litomi/db/app/query/subscription'
import { recordWebhookEvent, wasWebhookEventProcessed } from '@litomi/db/app/query/webhook-event'
import { Hono } from 'hono'

import type { Env } from '@/app'

const route = new Hono<Env>()

route.post('/portone/webhook', async (c) => {
  if (!isWebhookConfigured()) {
    return c.body(null, 503)
  }

  const rawBody = await c.req.text()
  const eventId = c.req.header('webhook-id') ?? ''

  let event: Awaited<ReturnType<typeof verifyBillingWebhook>>
  try {
    event = await verifyBillingWebhook(rawBody, {
      'webhook-id': eventId,
      'webhook-signature': c.req.header('webhook-signature') ?? '',
      'webhook-timestamp': c.req.header('webhook-timestamp') ?? '',
    })
  } catch (error) {
    console.error('billing webhook: signature verification failed', error)
    return c.body('invalid signature', 400)
  }

  if (!event) {
    return c.body(null, 200)
  }

  if (eventId && (await wasWebhookEventProcessed(eventId))) {
    return c.body(null, 200)
  }

  if (event.type === 'billingKeyDeleted') {
    await markPaymentMethodDeletedByToken(event.billingKey)
  } else {
    const payment = await getPaymentByPaymentId(event.paymentId)

    if (payment && !(event.type === 'paid' && payment.status === 'paid')) {
      let remote: Awaited<ReturnType<typeof getRemotePayment>>
      try {
        remote = await getRemotePayment(event.paymentId)
      } catch (error) {
        console.error('billing webhook: getPayment failed', { paymentId: event.paymentId, error })
        return c.body(null, 500)
      }

      if (event.type === 'refunded') {
        await applyPaymentRefunds(event.paymentId, remote.refunds)
      } else if (remote.status === 'paid') {
        if (remote.amount !== null && remote.amount !== payment.amount) {
          console.error('billing webhook: amount mismatch', {
            paymentId: event.paymentId,
            expected: payment.amount,
            actual: remote.amount,
          })
          return c.body(null, 200)
        }

        await confirmPayment(event.paymentId, {
          providerTxnId: remote.providerTxnId ?? event.paymentId,
          paidAt: remote.paidAt ?? new Date(),
          method: remote.method,
        })
      }
    }
  }

  if (eventId) {
    await recordWebhookEvent({
      eventId,
      type: event.type,
      payload: rawBody,
    })
  }

  return c.body(null, 200)
})

export default route
