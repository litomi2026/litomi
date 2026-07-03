import { cancelPayment, getRemotePayment, isBillingConfigured } from '@litomi/billing'
import { chatHandleParamSchema, type POSTV1ChatSubscriptionRefundResponse } from '@litomi/contracts'
import { getChatArtistByHandle } from '@litomi/db/app/query/chat'
import { applyPaymentRefunds, getLatestPaidInvoicePayment } from '@litomi/db/app/query/refund'
import { getSubscription, SUBSCRIPTION_TARGET_CHAT_ARTIST } from '@litomi/db/app/query/subscription'
import { hasOwnRepliesInWindow, messageIdAtOrAfter } from '@litomi/db/chat/query'
import { ENTITLEMENT_CHANNEL, type EntitlementRevokedEvent } from '@litomi/kv/channels'
import { connectPubSub, publisherClient } from '@litomi/kv/pubsub'
import { Hono } from 'hono'
import { createFactory } from 'hono/factory'
import ms from 'ms'

import type { Env } from '@/app'

import { requireAuth } from '@/middleware/require-auth'
import { problemResponse } from '@/utils/problem'
import { zProblemValidator } from '@/utils/validator'

import { toSubscriptionDTO } from '../../../../dto'

// 전자상거래법 청약철회 — 결제일로부터 7일
const REFUND_WINDOW_MS = ms('7 days')

const route = new Hono<Env>()
const factory = createFactory<Env>()
const middlewares = factory.createHandlers(requireAuth, zProblemValidator('param', chatHandleParamSchema))

// 최근 결제(현재 기간)를 전액 환불한다. 조건: 결제 7일 이내 + 그 기간에 답장 미발신(수신만 OK).
// PG 취소 후 상태 반영은 웹훅과 같은 applyPaymentRefunds 경로로 수렴해 멱등이다.
route.post('/', ...middlewares, async (c) => {
  if (!isBillingConfigured()) {
    return problemResponse(c, { status: 503 })
  }

  const userId = c.get('userId')!
  const { handle } = c.req.valid('param')
  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return problemResponse(c, { status: 404 })
  }

  const subscription = await getSubscription({
    userId,
    targetType: SUBSCRIPTION_TARGET_CHAT_ARTIST,
    targetId: artist.id,
  })

  if (!subscription) {
    return problemResponse(c, { status: 404 })
  }

  const candidate = await getLatestPaidInvoicePayment(subscription.id)

  if (!candidate?.paidAt) {
    return problemResponse(c, {
      status: 400,
      detail: '환불할 결제가 없어요.',
    })
  }

  const now = new Date()

  if (now.getTime() - candidate.paidAt.getTime() > REFUND_WINDOW_MS) {
    return problemResponse(c, {
      status: 403,
      detail: '결제일로부터 7일이 지나 환불할 수 없어요.',
    })
  }

  const window = {
    fromId: messageIdAtOrAfter(candidate.periodStart),
    toIdExclusive: messageIdAtOrAfter(candidate.periodEnd),
  }

  if (await hasOwnRepliesInWindow(userId, artist.id, window)) {
    return problemResponse(c, {
      status: 403,
      detail: '이번 결제 기간에 답장을 보내서 환불할 수 없어요.',
    })
  }

  // 취소 요청이 던져도(이미 취소됨 등) 아래 대사가 실제 상태로 수렴시키므로 삼키고 진행한다.
  try {
    await cancelPayment({
      paymentId: candidate.paymentId,
      reason: '구매자 청약철회',
    })
  } catch (error) {
    console.error('refund: cancelPayment failed', {
      paymentId: candidate.paymentId,
      error,
    })
  }

  let remote: Awaited<ReturnType<typeof getRemotePayment>>
  try {
    remote = await getRemotePayment(candidate.paymentId)
  } catch (error) {
    console.error('refund: reconcile getPayment failed', {
      paymentId: candidate.paymentId,
      error,
    })

    return problemResponse(c, {
      status: 502,
      detail: '환불 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
    })
  }

  const updated = await applyPaymentRefunds(candidate.paymentId, remote.refunds)
  const refundedTotal = remote.refunds.reduce((total, refund) => total + refund.amount, 0)

  if (refundedTotal < candidate.amount) {
    return problemResponse(c, {
      status: 402,
      detail: '환불이 완료되지 않았어요. 잠시 후 다시 시도해 주세요.',
    })
  }

  await publishEntitlementRevoked(userId, artist.id)

  if (!updated) {
    return problemResponse(c, { status: 500 })
  }

  return c.json({
    subscription: toSubscriptionDTO(updated),
  } satisfies POSTV1ChatSubscriptionRefundResponse)
})

// 게이트웨이 강퇴는 best-effort — 실패해도 주기 재검증이 곧 따라잡으므로 환불 응답을 막지 않는다.
async function publishEntitlementRevoked(userId: number, artistId: number): Promise<void> {
  const event: EntitlementRevokedEvent = {
    t: 'revoked',
    userId,
    artistId,
  }

  try {
    await connectPubSub()
    await publisherClient.publish(ENTITLEMENT_CHANNEL, JSON.stringify(event))
  } catch (error) {
    console.error('refund: entitlement revoke publish failed', { userId, artistId, error })
  }
}

export default route
