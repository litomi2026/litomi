import { env } from '@litomi/env/server.common'
import { BillingKeyClient, PaymentClient, Webhook } from '@portone/server-sdk'

const { PORTONE_API_SECRET, PORTONE_STORE_ID, PORTONE_CHANNEL_KEY, PORTONE_WEBHOOK_SECRET } = env

export function isBillingConfigured(): boolean {
  return Boolean(PORTONE_API_SECRET && PORTONE_STORE_ID && PORTONE_CHANNEL_KEY)
}

export function isWebhookConfigured(): boolean {
  return Boolean(PORTONE_API_SECRET && PORTONE_WEBHOOK_SECRET)
}

function requireSecret(): string {
  if (!PORTONE_API_SECRET) {
    throw new Error('PORTONE_API_SECRET is not configured')
  }

  return PORTONE_API_SECRET
}

export interface CardBrief {
  method: string | null
  brand: string | null
  cardLast4: string | null
}

export async function inspectBillingKey(billingKey: string): Promise<CardBrief> {
  const info = await BillingKeyClient({ secret: requireSecret() }).getBillingKeyInfo({ billingKey })
  return extractCardBrief(info)
}

export async function revokeBillingKey(billingKey: string): Promise<void> {
  await BillingKeyClient({ secret: requireSecret() }).deleteBillingKey({ billingKey })
}

export interface ChargeInput {
  paymentId: string
  billingKey: string
  orderName: string
  amount: number
  currency: string
}

export interface ChargeResult {
  providerTxnId: string
  paidAt: Date
}

export async function chargeWithBillingKey(input: ChargeInput): Promise<ChargeResult> {
  const { payment } = await PaymentClient({ secret: requireSecret() }).payWithBillingKey({
    paymentId: input.paymentId,
    billingKey: input.billingKey,
    orderName: input.orderName,
    amount: { total: input.amount },
    currency: input.currency as 'KRW',
  })

  return { providerTxnId: payment.pgTxId, paidAt: new Date(payment.paidAt) }
}

export type RemotePaymentStatus = 'paid' | 'failed' | 'canceled' | 'pending' | 'unknown'

export interface RemoteRefund {
  providerRefundId: string
  amount: number
  reason: string | null
  refundedAt: Date
}

export interface RemotePayment {
  status: RemotePaymentStatus
  providerTxnId: string | null
  paidAt: Date | null
  amount: number | null
  method: string | null
  refunds: RemoteRefund[]
}

export async function getRemotePayment(paymentId: string): Promise<RemotePayment> {
  const payment = (await PaymentClient({ secret: requireSecret() }).getPayment({ paymentId })) as {
    status?: string
    pgTxId?: string
    paidAt?: string
    amount?: { total?: number }
    method?: { type?: string }
    cancellations?: RawCancellation[]
  }

  return {
    status: normalizeStatus(payment.status),
    providerTxnId: payment.pgTxId ?? null,
    paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
    amount: payment.amount?.total ?? null,
    method: normalizeMethod(payment.method?.type),
    refunds: extractRefunds(payment.cancellations),
  }
}

export interface WebhookHeaders {
  'webhook-id': string
  'webhook-signature': string
  'webhook-timestamp': string
}

export type BillingWebhookEvent =
  | { type: 'billingKeyDeleted'; billingKey: string }
  | { type: 'paid'; paymentId: string }
  | { type: 'refunded'; paymentId: string }

export async function verifyBillingWebhook(
  rawBody: string,
  headers: WebhookHeaders,
): Promise<BillingWebhookEvent | null> {
  if (!PORTONE_WEBHOOK_SECRET) {
    throw new Error('PORTONE_WEBHOOK_SECRET is not configured')
  }

  const webhook = await Webhook.verify(PORTONE_WEBHOOK_SECRET, rawBody, headers)

  switch (webhook.type) {
    case 'Transaction.Paid':
      return {
        type: 'paid',
        paymentId: webhook.data.paymentId,
      }
    case 'Transaction.Cancelled':
    case 'Transaction.PartialCancelled':
      return {
        type: 'refunded',
        paymentId: webhook.data.paymentId,
      }
    case 'BillingKey.Deleted':
      return {
        type: 'billingKeyDeleted',
        billingKey: webhook.data.billingKey,
      }
    default:
      return null
  }
}

export interface ChargeFailure {
  code: string | null
  message: string
}

export function describeChargeFailure(cause: unknown): ChargeFailure {
  if (cause instanceof Error) {
    return {
      code: cause.name.slice(0, 64),
      message: cause.message.slice(0, 256),
    }
  }

  return {
    code: null,
    message: String(cause).slice(0, 256),
  }
}

export interface BillingGateway {
  charge(input: ChargeInput): Promise<ChargeResult>
  getPayment(paymentId: string): Promise<RemotePayment>
}

export function createBillingGateway(): BillingGateway | null {
  if (!PORTONE_API_SECRET) {
    return null
  }

  return {
    charge: chargeWithBillingKey,
    getPayment: getRemotePayment,
  }
}

function normalizeStatus(status: string | undefined): RemotePaymentStatus {
  switch (status) {
    case 'PAID':
      return 'paid'
    case 'FAILED':
      return 'failed'
    case 'CANCELLED':
    case 'PARTIAL_CANCELLED':
      return 'canceled'
    case 'READY':
    case 'PAY_PENDING':
    case 'VIRTUAL_ACCOUNT_ISSUED':
      return 'pending'
    default:
      return 'unknown'
  }
}

function extractCardBrief(info: unknown): CardBrief {
  const methods = (info as { methods?: Array<{ type?: string; card?: { name?: string; number?: string } }> }).methods
  const method = normalizeMethod(methods?.[0]?.type)
  const card = methods?.find((entry) => entry.type === 'BillingKeyPaymentMethodCard')?.card

  if (!card) {
    return {
      method,
      brand: null,
      cardLast4: null,
    }
  }

  const last4 = card.number?.match(/(\d{4})\D*$/)?.[1] ?? null

  return {
    method,
    brand: card.name ?? 'card',
    cardLast4: last4,
  }
}

function normalizeMethod(type: string | undefined): string | null {
  const kind = type?.replace(/^(BillingKey)?PaymentMethod/, '')

  if (!kind) {
    return null
  }

  return kind.charAt(0).toLowerCase() + kind.slice(1)
}

interface RawCancellation {
  status?: string
  id?: string
  totalAmount?: number
  reason?: string
  cancelledAt?: string
  requestedAt?: string
}

function extractRefunds(cancellations: RawCancellation[] | undefined): RemoteRefund[] {
  return (cancellations ?? [])
    .filter((cancellation) => cancellation.status === 'SUCCEEDED' && cancellation.id)
    .map((cancellation) => {
      const at = cancellation.cancelledAt ?? cancellation.requestedAt
      return {
        providerRefundId: cancellation.id!,
        amount: cancellation.totalAmount ?? 0,
        // Pre-truncated to the payment_refund column width; consumers write it verbatim.
        reason: cancellation.reason?.slice(0, 256) ?? null,
        refundedAt: at ? new Date(at) : new Date(),
      }
    })
    .sort((a, b) => a.refundedAt.getTime() - b.refundedAt.getTime())
}
