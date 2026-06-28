export const BILLING_TEST_AMOUNT = 1000
export const BILLING_CURRENCY = 'KRW'

export interface POSTV1BillingTestPaymentResponse {
  paymentId: string
  storeId: string
  channelKey: string
  orderName: string
  amount: number
  currency: string
}
