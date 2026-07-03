import { chargeWithBillingKey, describeChargeFailure, getRemotePayment, isBillingConfigured } from '@litomi/billing'
import {
  chatHandleParamSchema,
  type POSTV1ChatSubscriptionResponse,
  postV1ChatSubscriptionBodySchema,
} from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { ensureOpenInvoice, voidOpenInvoice } from '@litomi/db/app/query/invoice'
import { ensureInvoicePayment, markPaymentFailed } from '@litomi/db/app/query/payment'
import { getActivePaymentMethodForUser } from '@litomi/db/app/query/payment-method'
import {
  addSubscriptionPeriod,
  confirmPayment,
  ensureSubscription,
  getSubscription,
  RENEWAL_GRACE_MS,
  SUBSCRIPTION_TARGET_CHAT_ARTIST,
  setAutoRenew,
} from '@litomi/db/app/query/subscription'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toSubscriptionDTO } from '../../../dto'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('json', postV1ChatSubscriptionBodySchema),
)

route.post('/', ...middlewares, async (c) => {
  if (!isBillingConfigured()) {
    return problemResponse(c, { status: 503 })
  }

  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const { paymentMethodId } = c.req.valid('json')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  if (!artist.isActive || artist.userId === userId || artist.priceAmount <= 0) {
    return problemResponse(c, { status: 403 })
  }

  const subscriptionKey = {
    userId,
    targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
    targetId: artist.id,
  }

  // 만료 전 재구독 = 새 결제 없이 autoRenew 재개.
  const current = await getSubscription(subscriptionKey)

  if (current && current.expiresAt.getTime() > Date.now()) {
    const resumed = current.autoRenew ? current : ((await setAutoRenew(subscriptionKey, true)) ?? current)

    return c.json({
      subscription: toSubscriptionDTO(resumed),
    } satisfies POSTV1ChatSubscriptionResponse)
  }

  const paymentMethod = await getActivePaymentMethodForUser({
    id: paymentMethodId,
    userId,
  })

  if (!paymentMethod) {
    return problemResponse(c, {
      status: 400,
      detail: '결제수단을 찾을 수 없어요.',
    })
  }

  const now = new Date()
  const orderName = `${artist.displayName} 구독`

  let paymentId: string | undefined
  try {
    const subscription = await ensureSubscription({
      userId,
      targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
      targetId: artist.id,
      paymentMethodId,
      priceAmount: artist.priceAmount,
      priceCurrency: artist.priceCurrency,
      now,
    })

    const lapsedMs = now.getTime() - subscription.expiresAt.getTime()
    const continuous = lapsedMs > 0 && lapsedMs <= RENEWAL_GRACE_MS

    if (lapsedMs > RENEWAL_GRACE_MS) {
      await voidOpenInvoice(subscription.id)
    }

    const periodStart = continuous ? subscription.expiresAt : now

    const invoice = await ensureOpenInvoice({
      subscriptionId: subscription.id,
      userId,
      targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
      targetId: artist.id,
      periodStart,
      periodEnd: addSubscriptionPeriod(periodStart),
      amount: artist.priceAmount,
      currency: artist.priceCurrency,
    })

    if (invoice) {
      ;({ paymentId } = await ensureInvoicePayment({
        invoiceId: invoice.id,
        userId,
        orderName,
        amount: invoice.amount,
        currency: invoice.currency,
      }))

      const charge = await chargeWithBillingKey({
        paymentId,
        billingKey: paymentMethod.token,
        orderName,
        amount: invoice.amount,
        currency: invoice.currency,
      })

      await confirmPayment(paymentId, {
        providerTxnId: charge.providerTxnId,
        paidAt: charge.paidAt,
        paymentMethodId,
        method: paymentMethod.method,
      })
    }
  } catch (error) {
    console.error('subscribe: charge failed', error)

    if (!paymentId) {
      return problemResponse(c, { status: 500 })
    }

    if (!(await settleAmbiguousCharge(paymentId, paymentMethodId, error))) {
      return problemResponse(c, {
        status: 402,
        detail: '결제에 실패했어요. 카드 상태를 확인한 뒤 다시 시도해 주세요.',
      })
    }
  }

  const subscription = await getSubscription(subscriptionKey)

  if (!subscription) {
    return problemResponse(c, { status: 500 })
  }

  return c.json({ subscription: toSubscriptionDTO(subscription) } satisfies POSTV1ChatSubscriptionResponse)
})

async function settleAmbiguousCharge(paymentId: string, paymentMethodId: number, cause: unknown): Promise<boolean> {
  let remote: Awaited<ReturnType<typeof getRemotePayment>>
  try {
    remote = await getRemotePayment(paymentId)
  } catch (error) {
    console.error('subscribe: reconcile getPayment failed', { paymentId, error })
    return false
  }

  if (remote.status === 'paid') {
    await confirmPayment(paymentId, {
      providerTxnId: remote.providerTxnId ?? paymentId,
      paidAt: remote.paidAt ?? new Date(),
      paymentMethodId,
      method: remote.method,
    })

    return true
  }

  if (remote.status === 'failed' || remote.status === 'canceled') {
    await markPaymentFailed(paymentId, describeChargeFailure(cause))
  }

  return false
}

export default route
