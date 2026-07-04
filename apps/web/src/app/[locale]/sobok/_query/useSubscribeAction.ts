'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { UserVisibleError } from '@/utils/api-request'
import { requestBillingKeyIssuance } from '../_lib/billing'
import useAddPaymentMethodMutation from './useAddPaymentMethodMutation'
import usePaymentMethodsQuery from './usePaymentMethodsQuery'
import useSubscribeMutation from './useSubscribeMutation'

export default function useSubscribeAction(handle: string, artistName: string, enabled = true) {
  const { data: billing } = usePaymentMethodsQuery(enabled)
  const { mutateAsync: requestSubscribe } = useSubscribeMutation(handle)
  const { mutateAsync: registerPaymentMethod } = useAddPaymentMethodMutation()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)
  const t = useTranslations('Sobok')

  const finishWithBillingKey = useCallback(
    async (billingKey: string) => {
      setPending(true)
      setError(null)

      try {
        const saved = await registerPaymentMethod({ token: billingKey })
        await requestSubscribe({ paymentMethodId: saved.id })
      } catch (caught) {
        setError(errorMessage(caught, t('subscribeAction.failed')))
      } finally {
        setPending(false)
      }
    },
    [registerPaymentMethod, requestSubscribe, t],
  )

  const start = useCallback(async () => {
    setPending(true)
    setError(null)

    try {
      const savedId = billing?.paymentMethods[0]?.id

      if (savedId) {
        await requestSubscribe({ paymentMethodId: savedId })
        return
      }

      if (!billing?.storeId || !billing.channelKey) {
        throw new UserVisibleError(t('billing.notReady'))
      }

      const billingKey = await requestBillingKeyIssuance({
        storeId: billing.storeId,
        channelKey: billing.channelKey,
        issueName: t('subscribeAction.issueName', { name: artistName }),
        errorMessages: { cancelled: t('billing.registerCancelled'), failed: t('billing.registerFailed') },
      })

      await finishWithBillingKey(billingKey)
    } catch (caught) {
      setError(errorMessage(caught, t('subscribeAction.failed')))
    } finally {
      setPending(false)
    }
  }, [billing, requestSubscribe, finishWithBillingKey, artistName, t])

  return {
    start,
    finishWithBillingKey,
    isPending,
    error,
    reportError: setError,
    clearError: () => setError(null),
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
