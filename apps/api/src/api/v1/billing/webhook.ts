import { getRemotePayment, isWebhookConfigured, verifyPaidWebhook } from '@litomi/billing'
import { getPaymentByPaymentId } from '@litomi/db/app/query/payment'
import { confirmPayment } from '@litomi/db/app/query/subscription'
import { Hono } from 'hono'

import type { Env } from '@/app'

const route = new Hono<Env>()

// PortOne V2 webhook (Standard Webhooks). Public + CSRF-exempt (see app.ts): it's a
// server-to-server call authenticated by HMAC signature, not a user session.
// Non-200 responses are retried by PortOne (up to 5x), so we ack (200) anything we
// can't act on and only return an error for transient failures worth retrying.
route.post('/portone/webhook', async (c) => {
  if (!isWebhookConfigured()) {
    return c.body(null, 503)
  }

  const rawBody = await c.req.text()

  let event: Awaited<ReturnType<typeof verifyPaidWebhook>>
  try {
    event = await verifyPaidWebhook(rawBody, {
      'webhook-id': c.req.header('webhook-id') ?? '',
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

  const { paymentId } = event
  const pending = await getPaymentByPaymentId(paymentId)

  if (!pending || pending.status === 'paid') {
    return c.body(null, 200)
  }

  let remote: Awaited<ReturnType<typeof getRemotePayment>>
  try {
    remote = await getRemotePayment(paymentId)
  } catch (error) {
    console.error('billing webhook: getPayment failed', { paymentId, error })
    return c.body(null, 500) // transient → let PortOne retry
  }

  if (remote.status !== 'paid') {
    return c.body(null, 200)
  }

  if (remote.amount !== null && remote.amount !== pending.amount) {
    console.error('billing webhook: amount mismatch', {
      paymentId,
      expected: pending.amount,
      actual: remote.amount,
    })
    return c.body(null, 200)
  }

  // The webhook is the backstop source of truth: settle the ledger and (for subscription
  // payments) extend the entitlement. Idempotent — the sync charge path usually confirmed
  // already, so a re-delivered webhook is a no-op. providerTxnId falls back to our paymentId
  // so the idempotency key stays non-null.
  await confirmPayment(paymentId, {
    providerTxnId: remote.providerTxnId ?? paymentId,
    paidAt: remote.paidAt ?? new Date(),
  })

  return c.body(null, 200)
})

export default route
