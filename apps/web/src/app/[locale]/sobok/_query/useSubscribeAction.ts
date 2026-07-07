'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import useAddCard from './useAddCard'
import useSubscribeMutation from './useSubscribeMutation'

export default function useSubscribeAction(handle: string, artistName: string, enabled = true, free = false) {
  const { billing, addCard, registerCard } = useAddCard(enabled && !free)
  const { mutateAsync: requestSubscribe } = useSubscribeMutation(handle)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setPending] = useState(false)
  const t = useTranslations('Sobok')

  // Mobile redirect resume: the billing key was already issued before the full-page redirect,
  // so just register it and subscribe.
  async function finishWithBillingKey(billingKey: string) {
    setPending(true)
    setError(null)

    try {
      const saved = await registerCard({ token: billingKey })
      await requestSubscribe({ paymentMethodId: saved.id })
    } catch (caught) {
      setError(errorMessage(caught, t('subscribeAction.failed')))
    } finally {
      setPending(false)
    }
  }

  async function start() {
    setPending(true)
    setError(null)

    try {
      if (free) {
        await requestSubscribe({})
        return
      }

      const savedId = billing?.paymentMethods[0]?.id

      if (savedId) {
        await requestSubscribe({ paymentMethodId: savedId })
        return
      }

      const method = await addCard(t('subscribeAction.issueName', { name: artistName }))
      await requestSubscribe({ paymentMethodId: method.id })
    } catch (caught) {
      setError(errorMessage(caught, t('subscribeAction.failed')))
    } finally {
      setPending(false)
    }
  }

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
