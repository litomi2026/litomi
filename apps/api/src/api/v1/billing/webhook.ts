import { getPaymentByPaymentId } from '@litomi/db/app/query/payment'
import { confirmPayment } from '@litomi/db/app/query/subscription'
import { env } from '@litomi/env/server.common'
import { PaymentClient, Webhook } from '@portone/server-sdk'
import { Hono } from 'hono'

import type { Env } from '@/app'

const { PORTONE_API_SECRET, PORTONE_WEBHOOK_SECRET } = env

const route = new Hono<Env>()

// PortOne V2 webhook (Standard Webhooks). Public + CSRF-exempt (see app.ts): it's a
// server-to-server call authenticated by HMAC signature, not a user session.
// Non-200 responses are retried by PortOne (up to 5x), so we ack (200) anything we
// can't act on and only return an error for transient failures worth retrying.
route.post('/portone/webhook', async (c) => {
  if (!PORTONE_API_SECRET || !PORTONE_WEBHOOK_SECRET) {
    return c.body(null, 503)
  }

  const rawBody = await c.req.text()

  let webhook: Awaited<ReturnType<typeof Webhook.verify>>
  try {
    webhook = await Webhook.verify(PORTONE_WEBHOOK_SECRET, rawBody, {
      'webhook-id': c.req.header('webhook-id') ?? '',
      'webhook-signature': c.req.header('webhook-signature') ?? '',
      'webhook-timestamp': c.req.header('webhook-timestamp') ?? '',
    })
  } catch (error) {
    console.error('billing webhook: signature verification failed', error)
    return c.body('invalid signature', 400)
  }

  if (webhook.type !== 'Transaction.Paid') {
    return c.body(null, 200)
  }

  const { paymentId } = webhook.data
  const pending = await getPaymentByPaymentId(paymentId)

  if (!pending || pending.status === 'paid') {
    return c.body(null, 200)
  }

  let payment: Awaited<ReturnType<ReturnType<typeof PaymentClient>['getPayment']>>
  try {
    payment = await PaymentClient({ secret: PORTONE_API_SECRET }).getPayment({ paymentId })
  } catch (error) {
    console.error('billing webhook: getPayment failed', { paymentId, error })
    return c.body(null, 500) // transient → let PortOne retry
  }

  if (payment.status !== 'PAID') {
    return c.body(null, 200)
  }

  if (payment.amount.total !== pending.amount) {
    console.error('billing webhook: amount mismatch', {
      paymentId,
      expected: pending.amount,
      actual: payment.amount.total,
    })
    return c.body(null, 200)
  }

  // The webhook is the backstop source of truth: settle the ledger and (for subscription
  // payments) extend the entitlement. Idempotent — the sync charge path usually confirmed
  // already, so a re-delivered webhook is a no-op. pgTxId falls back to our paymentId so the
  // idempotency key stays non-null.
  await confirmPayment(paymentId, {
    providerTxnId: payment.pgTxId ?? paymentId,
    paidAt: new Date(),
  })

  return c.body(null, 200)
})

export default route
