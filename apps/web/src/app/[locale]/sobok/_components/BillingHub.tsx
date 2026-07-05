'use client'

import type { BillingSubscriptionItemDTO, PaymentHistoryItemDTO } from '@litomi/contracts'
import { ChevronLeft, CreditCard, Loader2, Plus, Receipt, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useEffectEvent, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { consumeBillingKeyRedirect, requestBillingKeyIssuance } from '../_lib/billing'
import { avatarURL } from '../_lib/chat'
import { formatDate, formatKRW } from '../_lib/format'
import useAddPaymentMethodMutation from '../_query/useAddPaymentMethodMutation'
import useBillingSubscriptionsQuery from '../_query/useBillingSubscriptionsQuery'
import useDeletePaymentMethodMutation from '../_query/useDeletePaymentMethodMutation'
import usePaymentHistoryQuery from '../_query/usePaymentHistoryQuery'
import usePaymentMethodsQuery from '../_query/usePaymentMethodsQuery'

export default function BillingHub() {
  const t = useTranslations('Sobok.billing')

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10 bg-background/80">
        <Link href="/sobok" className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h2 className="font-bold text-lg text-foreground ml-2">{t('title')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md space-y-8 px-5 py-6">
          <SubscriptionsSection />
          <PaymentMethodsSection />
          <PaymentHistorySection />
        </div>
      </div>
    </div>
  )
}

function SubscriptionsSection() {
  const { data, isLoading } = useBillingSubscriptionsQuery()
  const t = useTranslations('Sobok.billing')
  const subscriptions = data?.subscriptions ?? []

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-400">{t('subscriptionsTitle')}</h3>
      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">{t('loading')}</p>
      ) : subscriptions.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{t('subscriptionsEmpty')}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {subscriptions.map((item) => (
            <SubscriptionItem key={item.artist.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  )
}

function SubscriptionItem({ item }: { item: BillingSubscriptionItemDTO }) {
  const t = useTranslations('Sobok.billing')
  const locale = useLocale()
  const { artist, subscription } = item
  const expiresAt = new Date(subscription.expiresAt)
  const live = expiresAt.getTime() > Date.now()

  const label = live
    ? subscription.autoRenew
      ? t('nextBilling', { date: formatDate(expiresAt, locale), price: formatKRW(item.priceAmount, locale) })
      : t('cancelScheduled', { date: formatDate(expiresAt, locale) })
    : t('expired')

  return (
    <li>
      <Link
        href={`/sobok/@${artist.handle}`}
        className="flex items-center gap-3 rounded-xl border border-foreground/10 p-3.5 transition-colors hover:bg-foreground/5"
      >
        <img
          src={avatarURL(artist.displayName, artist.imageURL)}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {artist.displayName}
            {artist.emoji && <span className="ml-1">{artist.emoji}</span>}
          </p>
          <p className={`mt-0.5 text-xs ${live ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</p>
        </div>
      </Link>
    </li>
  )
}

function PaymentMethodsSection() {
  const { data, isLoading } = usePaymentMethodsQuery()
  const { mutateAsync: registerPaymentMethod, error: registerError } = useAddPaymentMethodMutation()
  const { mutate: deletePaymentMethod, isPending: deleting } = useDeletePaymentMethodMutation()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const t = useTranslations('Sobok.billing')
  const errorMessage = issueError ?? (registerError instanceof Error ? registerError.message : null)

  // 모바일 빌링키 발급의 full-page redirect 복귀 — 카드 등록을 마저 진행한다.
  const resumeCardRegistration = useEffectEvent(() => {
    const result = consumeBillingKeyRedirect(t('registerFailed'))

    if (!result) {
      return
    }

    if ('billingKey' in result) {
      registerPaymentMethod({ token: result.billingKey }).catch((caught) => {
        setIssueError(caught instanceof Error ? caught.message : t('registerFailed'))
      })
    } else {
      setIssueError(result.errorMessage)
    }
  })

  async function handleAddCard() {
    if (!data?.storeId || !data.channelKey) {
      setIssueError(t('notReady'))
      return
    }

    setIssuing(true)
    setIssueError(null)

    try {
      const billingKey = await requestBillingKeyIssuance({
        storeId: data.storeId,
        channelKey: data.channelKey,
        issueName: t('issueName'),
        errorMessages: { cancelled: t('registerCancelled'), failed: t('registerFailed') },
      })

      await registerPaymentMethod({ token: billingKey })
    } catch (caught) {
      setIssueError(caught instanceof Error ? caught.message : t('registerFailed'))
    } finally {
      setIssuing(false)
    }
  }

  useEffect(() => {
    resumeCardRegistration()
  }, [])

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-400">{t('methodsTitle')}</h3>

      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">{t('loading')}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {data?.paymentMethods.map((method) => (
            <li key={method.id} className="flex items-center gap-3 rounded-xl border border-foreground/10 p-3.5">
              <CreditCard className="h-5 w-5 shrink-0 text-zinc-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {method.brand ?? t('card')}
                  {method.cardLast4 && <span className="ml-1.5 text-zinc-400">•••• {method.cardLast4}</span>}
                </p>
              </div>
              {confirmingId === method.id ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => deletePaymentMethod(method.id, { onSettled: () => setConfirmingId(null) })}
                    disabled={deleting}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-60"
                  >
                    {t('confirmDelete')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={deleting}
                    className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(method.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  aria-label={t('deleteMethodAria')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {errorMessage && <p className="mt-2 text-xs text-red-400">{errorMessage}</p>}

      <button
        type="button"
        onClick={() => void handleAddCard()}
        disabled={issuing}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/20 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-400 disabled:opacity-60"
      >
        {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {t('addCard')}
      </button>
      <p className="mt-1.5 text-[11px] text-zinc-500">{t('cardFallbackNote')}</p>
    </section>
  )
}

function PaymentHistorySection() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = usePaymentHistoryQuery()
  const t = useTranslations('Sobok.billing')
  const payments = data?.pages.flatMap((page) => page.payments) ?? []

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-400">{t('historyTitle')}</h3>

      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">{t('loading')}</p>
      ) : payments.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">{t('historyEmpty')}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {payments.map((payment) => (
            <PaymentItem key={payment.id} payment={payment} />
          ))}
        </ul>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/10 py-2 text-sm text-zinc-400 transition-colors hover:bg-foreground/5 disabled:opacity-60"
        >
          {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('loadMore')}
        </button>
      )}
    </section>
  )
}

function PaymentItem({ payment }: { payment: PaymentHistoryItemDTO }) {
  const t = useTranslations('Sobok.billing')
  const locale = useLocale()

  const statusTone =
    payment.status === 'paid'
      ? 'text-emerald-400'
      : payment.status === 'failed'
        ? 'text-red-400'
        : payment.status === 'refunded'
          ? 'text-amber-400'
          : 'text-zinc-400'

  const showReceipt = payment.status === 'paid' || payment.status === 'refunded'
  const partiallyRefunded = payment.status === 'paid' && payment.refundedAmount > 0

  return (
    <li className="rounded-xl border border-foreground/10 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{payment.orderName}</p>
        <span className={`shrink-0 text-xs font-semibold ${statusTone}`}>{t(`status.${payment.status}`)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {formatKRW(payment.amount, locale)}
          {partiallyRefunded && ` (${t('refunded', { amount: formatKRW(payment.refundedAmount, locale) })})`}
          {' · '}
          {formatDate(new Date(payment.paidAt ?? payment.createdAt), locale)}
        </p>
        {showReceipt && (
          <a
            href={`/api/v1/billing/payments/${payment.paymentId}/receipt`}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5" />
            {t('receipt')}
          </a>
        )}
      </div>
    </li>
  )
}
