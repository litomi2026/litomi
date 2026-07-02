import { env } from '@litomi/env/server.common'
import { BillingKeyClient, PaymentClient } from '@portone/server-sdk'

const { PORTONE_API_SECRET, PORTONE_STORE_ID, PORTONE_CHANNEL_KEY } = env

// PortOne is fully configured only when both the publishable (client) and secret (server)
// keys exist. Routes 503 when false rather than half-charging.
export function isBillingConfigured(): boolean {
  return Boolean(PORTONE_API_SECRET && PORTONE_STORE_ID && PORTONE_CHANNEL_KEY)
}

function requireSecret(): string {
  if (!PORTONE_API_SECRET) {
    throw new Error('PORTONE_API_SECRET is not configured')
  }

  return PORTONE_API_SECRET
}

export interface CardBrief {
  brand: string | null
  cardLast4: string | null
}

// Confirm a freshly issued billing key exists (throws on an unknown token) and pull display
// metadata for the "결제수단" UI. Card fields are best-effort.
export async function inspectBillingKey(billingKey: string): Promise<CardBrief> {
  const info = await BillingKeyClient({ secret: requireSecret() }).getBillingKeyInfo({ billingKey })
  return extractCardBrief(info)
}

export async function revokeBillingKey(billingKey: string): Promise<void> {
  await BillingKeyClient({ secret: requireSecret() }).deleteBillingKey({ billingKey })
}

export interface ChargeResult {
  providerTxnId: string
  paidAt: Date
}

// Charge a saved billing key. Resolves only on a successful (PAID) charge; throws otherwise
// (declined card, revoked key, PG error) so the caller can mark the payment failed.
export async function chargeWithBillingKey(input: {
  paymentId: string
  billingKey: string
  orderName: string
  amount: number
  currency: string
}): Promise<ChargeResult> {
  const { payment } = await PaymentClient({ secret: requireSecret() }).payWithBillingKey({
    paymentId: input.paymentId,
    billingKey: input.billingKey,
    orderName: input.orderName,
    amount: { total: input.amount },
    currency: input.currency as 'KRW',
  })

  return { providerTxnId: payment.pgTxId, paidAt: new Date(payment.paidAt) }
}

// The billing-key info union carries a card method only for card keys; read it defensively.
function extractCardBrief(info: unknown): CardBrief {
  const methods = (info as { methods?: Array<{ type?: string; card?: { name?: string; number?: string } }> }).methods
  const card = methods?.find((method) => method.type === 'BillingKeyPaymentMethodCard')?.card

  if (!card) {
    return { brand: null, cardLast4: null }
  }

  const last4 = card.number?.match(/(\d{4})\D*$/)?.[1] ?? null
  return { brand: card.name ?? 'card', cardLast4: last4 }
}
