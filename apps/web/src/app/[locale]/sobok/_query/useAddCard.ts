'use client'

import { useTranslations } from 'next-intl'
import { UserVisibleError } from '@/utils/api-request'
import { requestBillingKeyIssuance } from '../_lib/billing'
import useAddPaymentMethodMutation from './useAddPaymentMethodMutation'
import usePaymentMethodsQuery from './usePaymentMethodsQuery'

// The PortOne "add a card" flow, shared by the billing hub and the subscribe action: fetch the
// publishable keys, issue a billing key client-side, and register it as a payment method. Also
// exposes the raw register (for the mobile full-page-redirect resume, where issuance already
// happened) plus the saved methods, so both callers compose off one source.
export default function useAddCard(enabled = true) {
  const { data: billing } = usePaymentMethodsQuery(enabled)
  const { mutateAsync: registerCard, error: registerError } = useAddPaymentMethodMutation()
  const t = useTranslations('Sobok.billing')

  // Issue a billing key then register it. Returns the saved method; throws UserVisibleError when
  // billing isn't configured, or the issuance/register error.
  async function addCard(issueName: string) {
    if (!billing?.storeId || !billing.channelKey) {
      throw new UserVisibleError(t('notReady'))
    }

    const billingKey = await requestBillingKeyIssuance({
      storeId: billing.storeId,
      channelKey: billing.channelKey,
      issueName,
      errorMessages: { cancelled: t('registerCancelled'), failed: t('registerFailed') },
    })

    return registerCard({ token: billingKey })
  }

  return {
    billing,
    addCard,
    registerCard,
    registerError,
  }
}
