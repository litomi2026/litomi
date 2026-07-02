import { chargeWithBillingKey, isBillingConfigured } from '@litomi/billing'
import {
  chatHandleParamSchema,
  type POSTV1ChatSubscriptionResponse,
  postV1ChatSubscriptionBodySchema,
} from '@litomi/contracts'
import { getChatArtistByHandle, hasActiveChatSubscription } from '@litomi/db/app/query/chat'
import { createPendingPayment, markPaymentFailed } from '@litomi/db/app/query/payment'
import { getActivePaymentMethodForUser } from '@litomi/db/app/query/payment-method'
import {
  addSubscriptionPeriod,
  confirmPayment,
  getSubscription,
  SUBSCRIPTION_TARGET_CHAT_ARTIST,
  setAutoRenew,
  setSubscriptionPaymentMethod,
} from '@litomi/db/app/query/subscription'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toSubscriptionDTO } from '../../../lib'

const route = new Hono<Env>()
const factory = createFactory<Env>()

const middlewares = factory.createHandlers(
  requireAuth,
  zProblemValidator('param', chatHandleParamSchema),
  zProblemValidator('json', postV1ChatSubscriptionBodySchema),
)

// Subscribe a fan to an artist: charge the first month from a saved billing key, then
// settle the ledger + entitlement idempotently (the webhook is a backstop). Server owns the
// price — the client never sends an amount.
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
    // Inactive, subscribing to your own artist, or an artist not open for subscription.
    return problemResponse(c, { status: 403 })
  }

  // Already inside a paid period → don't double-charge. Re-subscribing while a cancel is
  // pending resumes auto-renew (undo the cancel); otherwise it's an idempotent no-op.
  if (await hasActiveChatSubscription(userId, artist.id)) {
    const current = await getSubscription(userId, SUBSCRIPTION_TARGET_CHAT_ARTIST, artist.id)
    if (current) {
      const resumed = current.autoRenew
        ? current
        : await setAutoRenew(userId, SUBSCRIPTION_TARGET_CHAT_ARTIST, artist.id, true)
      return c.json({ subscription: toSubscriptionDTO(resumed ?? current) } satisfies POSTV1ChatSubscriptionResponse)
    }
  }

  const paymentMethod = await getActivePaymentMethodForUser(paymentMethodId, userId)

  if (!paymentMethod) {
    return problemResponse(c, { status: 400, detail: '결제수단을 찾을 수 없어요.' })
  }

  const paymentId = crypto.randomUUID()
  const periodStart = new Date()
  const periodEnd = addSubscriptionPeriod(periodStart)
  const orderName = `${artist.displayName} 구독`

  try {
    await createPendingPayment({
      paymentId,
      userId,
      orderName,
      amount: artist.priceAmount,
      currency: artist.priceCurrency,
      targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
      targetId: artist.id,
      periodStart,
      periodEnd,
    })
  } catch (error) {
    console.error('subscribe: createPendingPayment failed', error)
    return problemResponse(c, { status: 500 })
  }

  try {
    const charge = await chargeWithBillingKey({
      paymentId,
      billingKey: paymentMethod.token,
      orderName,
      amount: artist.priceAmount,
      currency: artist.priceCurrency,
    })
    await confirmPayment(paymentId, { providerTxnId: charge.providerTxnId, paidAt: charge.paidAt, paymentMethodId })
  } catch (error) {
    console.error('subscribe: charge failed', error)
    await markPaymentFailed(paymentId)
    return problemResponse(c, { status: 402, detail: '결제에 실패했어요. 카드 상태를 확인한 뒤 다시 시도해 주세요.' })
  }

  // Guarantee the funding method is bound even if the webhook confirmed the charge first.
  await setSubscriptionPaymentMethod(userId, SUBSCRIPTION_TARGET_CHAT_ARTIST, artist.id, paymentMethodId)

  const subscription = await getSubscription(userId, SUBSCRIPTION_TARGET_CHAT_ARTIST, artist.id)

  if (!subscription) {
    return problemResponse(c, { status: 500 })
  }

  return c.json({ subscription: toSubscriptionDTO(subscription) } satisfies POSTV1ChatSubscriptionResponse)
})

export default route
