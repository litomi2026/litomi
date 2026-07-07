'use client'

import type { ChatSubscriptionDTO } from '@litomi/contracts'
import { Settings } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { getErrorMessage } from '@/lib/error-message'
import { formatDate } from '../_lib/format'
import useCancelSubscriptionMutation from '../_query/useCancelSubscriptionMutation'
import useRefundSubscriptionMutation from '../_query/useRefundSubscriptionMutation'
import Button from './ui/Button'

interface Props {
  handle: string
  subscription: ChatSubscriptionDTO
  // Resuming a lapsing subscription is the full subscribe action (payment method included),
  // so the owner of that flow passes it in.
  onResume: () => void
  resuming: boolean
}

export default function SubscriptionMenu({ handle, subscription, onResume, resuming }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmingRefund, setConfirmingRefund] = useState(false)
  const { mutate: cancelSubscription, isPending: cancelling } = useCancelSubscriptionMutation(handle)
  const { mutate: refundSubscription, isPending: refunding, error } = useRefundSubscriptionMutation(handle)
  const t = useTranslations('Sobok.subscription')
  const tErrors = useTranslations('Errors')
  const locale = useLocale()

  const isBusy = cancelling || refunding || resuming
  const refundError = getErrorMessage(tErrors, error)
  const endsAt = new Date(subscription.expiresAt)

  function close() {
    setOpen(false)
    setConfirmingRefund(false)
  }

  function renderStatus() {
    if (subscription.status === 'past_due') {
      return (
        <>
          <p className="text-sm font-medium text-foreground">{t('renewalFailed')}</p>
          <p className="mt-1 text-xs text-zinc-400">{t('renewalFailedBody', { date: formatDate(endsAt, locale) })}</p>
          <Link
            href="/sobok/billing"
            onClick={close}
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
          >
            {t('updatePaymentCta')}
          </Link>
        </>
      )
    }

    if (subscription.autoRenew) {
      return (
        <>
          <p className="text-sm font-medium text-foreground">{t('active')}</p>
          <p className="mt-1 text-xs text-zinc-400">{t('nextBillingDate', { date: formatDate(endsAt, locale) })}</p>
          <Button
            busy={isBusy}
            className="mt-3 w-full font-medium"
            onClick={() => cancelSubscription()}
            variant="outline"
          >
            {t('cancelCta')}
          </Button>
        </>
      )
    }

    return (
      <>
        <p className="text-sm font-medium text-foreground">{t('cancelScheduled')}</p>
        <p className="mt-1 text-xs text-zinc-400">{t('endsAt', { date: formatDate(endsAt, locale) })}</p>
        <Button busy={isBusy} className="mt-3 w-full" onClick={onResume}>
          {t('keepCta')}
        </Button>
      </>
    )
  }

  function renderCard() {
    if (confirmingRefund) {
      return (
        <>
          <p className="text-sm font-medium text-foreground">{t('refundConfirmTitle')}</p>
          <p className="mt-1 text-xs text-zinc-400">{t('refundConfirmBody')}</p>
          {refundError && <p className="mt-2 text-xs text-red-400">{refundError}</p>}
          <Button busy={isBusy} className="mt-3 w-full" onClick={() => refundSubscription()} variant="danger">
            {t('refundCta')}
          </Button>
          <Button
            className="mt-2 w-full font-medium"
            disabled={isBusy}
            onClick={() => setConfirmingRefund(false)}
            variant="outline"
          >
            {t('back')}
          </Button>
        </>
      )
    }

    return (
      <>
        {renderStatus()}
        <button
          type="button"
          onClick={() => setConfirmingRefund(true)}
          disabled={isBusy}
          className="mt-2 w-full py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          {t('refundLink')}
        </button>
      </>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="p-2 text-zinc-400 transition-colors hover:text-foreground"
        aria-label={t('manage')}
      >
        <Settings className="h-5 w-5" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default"
            onClick={close}
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-2xl border border-foreground/10 bg-zinc-800 p-4 shadow-xl">
            {renderCard()}
          </div>
        </>
      )}
    </div>
  )
}
