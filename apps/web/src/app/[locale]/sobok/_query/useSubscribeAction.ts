'use client'

import { useCallback, useState } from 'react'
import { UserVisibleError } from '@/utils/api-request'
import { requestBillingKeyIssuance } from '../_lib/billing'
import useAddPaymentMethodMutation from './useAddPaymentMethodMutation'
import usePaymentMethodsQuery from './usePaymentMethodsQuery'
import useSubscribeMutation from './useSubscribeMutation'

export default function useSubscribeAction(handle: string, artistName: string, enabled = true) {
  const { data: billing } = usePaymentMethodsQuery(enabled)
  const { mutateAsync: registerPaymentMethod } = useAddPaymentMethodMutation()
  const { mutateAsync: requestSubscribe } = useSubscribeMutation(handle)
  const [isPending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finishWithBillingKey = useCallback(
    async (billingKey: string) => {
      setPending(true)
      setError(null)

      try {
        const saved = await registerPaymentMethod({ token: billingKey })
        await requestSubscribe({ paymentMethodId: saved.id })
      } catch (caught) {
        setError(errorMessage(caught))
      } finally {
        setPending(false)
      }
    },
    [registerPaymentMethod, requestSubscribe],
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
        throw new UserVisibleError('결제가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.')
      }

      const billingKey = await requestBillingKeyIssuance({
        storeId: billing.storeId,
        channelKey: billing.channelKey,
        issueName: `${artistName} 구독`,
      })

      await finishWithBillingKey(billingKey)
    } catch (caught) {
      setError(errorMessage(caught))
    } finally {
      setPending(false)
    }
  }, [billing, requestSubscribe, finishWithBillingKey, artistName])

  return {
    start,
    finishWithBillingKey,
    isPending,
    error,
    reportError: setError,
    clearError: () => setError(null),
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return '구독에 실패했어요. 잠시 후 다시 시도해 주세요.'
}
