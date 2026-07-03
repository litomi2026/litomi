import { type BillingGateway, describeChargeFailure } from '@litomi/billing'
import { getChatArtistById } from '@litomi/db/app/query/chat'
import { ensureOpenInvoice, voidOpenInvoice } from '@litomi/db/app/query/invoice'
import { ensureInvoicePayment, markPaymentFailed } from '@litomi/db/app/query/payment'
import { getRenewalPaymentMethod } from '@litomi/db/app/query/payment-method'
import {
  confirmPayment,
  type DueSubscription,
  listSubscriptionsDue,
  markSubscriptionStatus,
} from '@litomi/db/app/query/subscription'
import {
  addSubscriptionPeriod,
  RENEWAL_GRACE_MS,
  SUBSCRIPTION_TARGET_CHAT_ARTIST,
} from '@litomi/domain/subscription/policy'

const PAGE_SIZE = 1000

export interface RenewSummary {
  scanned: number
  charged: number
  pastDue: number
  canceled: number
  expired: number
  skipped: number
}

export interface ProcessOptions {
  gateway: BillingGateway
  now?: Date
}

export async function processDueSubscriptions({ gateway, now = new Date() }: ProcessOptions): Promise<RenewSummary> {
  const summary: RenewSummary = {
    scanned: 0,
    charged: 0,
    pastDue: 0,
    canceled: 0,
    expired: 0,
    skipped: 0,
  }

  let afterId = 0

  while (true) {
    const due = await listSubscriptionsDue({
      now,
      afterId,
      limit: PAGE_SIZE,
    })

    if (due.length === 0) {
      break
    }

    for (const sub of due) {
      afterId = sub.id
      summary.scanned++
      await handleDue(sub, now, gateway, summary)
    }

    if (due.length < PAGE_SIZE) {
      break
    }
  }

  return summary
}

async function handleDue(
  sub: DueSubscription,
  now: Date,
  gateway: BillingGateway,
  summary: RenewSummary,
): Promise<void> {
  if (!sub.autoRenew) {
    if (sub.expiresAt.getTime() <= now.getTime()) {
      await expireSubscription(sub.id, 'canceled', summary)
    } else {
      summary.skipped++
    }
    return
  }

  // Only chat-artist subscriptions are chargeable today; leave any other target untouched.
  if (sub.targetType !== SUBSCRIPTION_TARGET_CHAT_ARTIST) {
    summary.skipped++
    return
  }

  const paymentMethod = await getRenewalPaymentMethod({ userId: sub.userId, preferredId: sub.paymentMethodId })
  const artist = await getChatArtistById(sub.targetId)

  if (!paymentMethod || !artist?.isActive || sub.priceAmount <= 0) {
    await applyDunning(sub, now, summary)
    return
  }

  const orderName = `${artist.displayName} 구독`
  const lapsedMs = now.getTime() - sub.expiresAt.getTime()
  const periodStart = lapsedMs > RENEWAL_GRACE_MS ? now : sub.expiresAt

  let invoice: Awaited<ReturnType<typeof ensureOpenInvoice>>
  let paymentId: string
  try {
    if (lapsedMs > RENEWAL_GRACE_MS) {
      await voidOpenInvoice(sub.id)
    }

    invoice = await ensureOpenInvoice({
      subscriptionId: sub.id,
      userId: sub.userId,
      targetType: sub.targetType,
      targetId: sub.targetId,
      periodStart,
      periodEnd: addSubscriptionPeriod(periodStart),
      amount: sub.priceAmount,
      currency: sub.priceCurrency,
    })

    if (!invoice) {
      summary.skipped++
      return
    }

    ;({ paymentId } = await ensureInvoicePayment({
      invoiceId: invoice.id,
      userId: sub.userId,
      orderName,
      amount: invoice.amount,
      currency: invoice.currency,
    }))
  } catch (error) {
    console.error('billing-worker: stage renewal failed', { subscriptionId: sub.id, error })
    summary.skipped++
    return
  }

  try {
    const charge = await gateway.charge({
      paymentId,
      billingKey: paymentMethod.token,
      orderName,
      amount: invoice.amount,
      currency: invoice.currency,
    })

    await confirmPayment(paymentId, {
      providerTxnId: charge.providerTxnId,
      paidAt: charge.paidAt,
      // 실제 결제된 카드로 기록 — fallback 카드였다면 구독 지정 카드가 여기서 자가치유된다.
      paymentMethodId: paymentMethod.id,
      method: paymentMethod.method,
    })

    summary.charged++
  } catch (error) {
    console.error('billing-worker: renewal charge failed', { subscriptionId: sub.id, error })
    await reconcileFailedCharge(sub, now, gateway, paymentId, paymentMethod.id, summary, error)
  }
}

async function expireSubscription(
  subscriptionId: number,
  status: 'canceled' | 'expired',
  summary: RenewSummary,
): Promise<void> {
  await voidOpenInvoice(subscriptionId)
  await markSubscriptionStatus(subscriptionId, status)
  summary[status]++
}

async function reconcileFailedCharge(
  sub: DueSubscription,
  now: Date,
  gateway: BillingGateway,
  paymentId: string,
  paymentMethodId: number,
  summary: RenewSummary,
  cause: unknown,
): Promise<void> {
  let remote: Awaited<ReturnType<BillingGateway['getPayment']>>
  try {
    remote = await gateway.getPayment(paymentId)
  } catch (error) {
    console.error('billing-worker: reconcile getPayment failed', { subscriptionId: sub.id, error })
    summary.skipped++
    return
  }

  if (remote.status === 'paid') {
    await confirmPayment(paymentId, {
      providerTxnId: remote.providerTxnId ?? paymentId,
      paidAt: remote.paidAt ?? now,
      paymentMethodId,
      method: remote.method,
    })

    summary.charged++
    return
  }

  if (remote.status === 'pending' || remote.status === 'unknown') {
    summary.skipped++
    return
  }

  await markPaymentFailed(paymentId, describeChargeFailure(cause))
  await applyDunning(sub, now, summary)
}

async function applyDunning(sub: DueSubscription, now: Date, summary: RenewSummary): Promise<void> {
  if (now.getTime() - sub.expiresAt.getTime() > RENEWAL_GRACE_MS) {
    await expireSubscription(sub.id, 'expired', summary)
  } else if (sub.status !== 'past_due') {
    await markSubscriptionStatus(sub.id, 'past_due')
    summary.pastDue++
  } else {
    summary.skipped++
  }
}
