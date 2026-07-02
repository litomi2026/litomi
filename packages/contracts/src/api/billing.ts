import { z } from 'zod'

export const BILLING_TEST_AMOUNT = 1000
export const BILLING_CURRENCY = 'KRW'

// The provider token (a PortOne billing key today) can be long; keep a generous bound.
const PAYMENT_METHOD_TOKEN_MAX_LENGTH = 256

export interface POSTV1BillingTestPaymentResponse {
  paymentId: string
  storeId: string
  channelKey: string
  orderName: string
  amount: number
  currency: string
}

// A saved payment method (display metadata only; the raw provider token never leaves the server).
export interface PaymentMethodDTO {
  id: number
  brand: string | null
  cardLast4: string | null
  createdAt: string
}

// The "결제수단" screen data: the viewer's saved methods + the publishable PortOne keys the
// client needs to issue a new one (absent when billing is not configured on the server).
export interface GETV1PaymentMethodsResponse {
  storeId?: string
  channelKey?: string
  paymentMethods: PaymentMethodDTO[]
}

// Register a payment method: the provider token the client issued (via @portone/browser-sdk
// requestIssueBillingKey today).
export const postV1PaymentMethodBodySchema = z.object({
  token: z.string().min(1).max(PAYMENT_METHOD_TOKEN_MAX_LENGTH),
})

export type POSTV1PaymentMethodResponse = PaymentMethodDTO
