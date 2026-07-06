'use client'

import type { BillingSubscriptionItemDTO, PaymentHistoryItemDTO, PaymentHistoryStatus } from '@litomi/contracts'
import { CreditCard, Plus, Receipt, Trash2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import useBillingKeyRedirect from '../_hooks/useBillingKeyRedirect'
import { formatDate, formatKRW } from '../_lib/format'
import useAddCard from '../_query/useAddCard'
import useBillingSubscriptionsQuery from '../_query/useBillingSubscriptionsQuery'
import useDeletePaymentMethodMutation from '../_query/useDeletePaymentMethodMutation'
import usePaymentHistoryQuery from '../_query/usePaymentHistoryQuery'
import usePaymentMethodsQuery from '../_query/usePaymentMethodsQuery'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import PageHeader, { HeaderBackLink } from './ui/PageHeader'
import Section from './ui/Section'
import Skeleton from './ui/Skeleton'

export default function BillingHub() {
  // 섹션별 쿼리가 제각각 도착하면 위 섹션의 높이 변화가 아래 섹션들을 여러 번 밀어낸다 —
  // 셋 다 준비될 때까지 스켈레톤을 유지해 스왑을 한 번으로 모은다(섹션 내부 훅과는
  // react-query가 dedupe하므로 요청이 늘지 않는다).
  const { isLoading: loadingSubscriptions } = useBillingSubscriptionsQuery()
  const { isLoading: loadingMethods } = usePaymentMethodsQuery()
  const { isLoading: loadingHistory } = usePaymentHistoryQuery()
  const t = useTranslations('Sobok.billing')
  const settling = loadingSubscriptions || loadingMethods || loadingHistory

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader
        back={<HeaderBackLink className="lg:hidden" href="/sobok" />}
        title={<h2 className="text-lg font-bold text-foreground">{t('title')}</h2>}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl space-y-8 px-5 py-6">
          <SubscriptionsSection loading={settling} />
          <PaymentMethodsSection loading={settling} />
          <PaymentHistorySection loading={settling} />
        </div>
      </div>
    </div>
  )
}

// Same footprint as a two-line card row, so the skeleton→content swap doesn't move the page.
function CardRowSkeleton({ avatar = false }: { avatar?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-foreground/10 p-3.5">
      {avatar && <Skeleton className="h-10 w-10 rounded-full" />}
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-44 max-w-full" />
      </div>
    </div>
  )
}

function SubscriptionsSection({ loading }: { loading: boolean }) {
  const { data } = useBillingSubscriptionsQuery()
  const t = useTranslations('Sobok.billing')
  const subscriptions = data?.subscriptions ?? []

  function renderBody() {
    if (loading) {
      return (
        <div className="space-y-2">
          <CardRowSkeleton avatar />
          <CardRowSkeleton avatar />
        </div>
      )
    }

    if (subscriptions.length === 0) {
      return <p className="text-sm text-zinc-500">{t('subscriptionsEmpty')}</p>
    }

    return (
      <ul className="space-y-2">
        {subscriptions.map((item) => (
          <SubscriptionItem key={item.artist.id} item={item} />
        ))}
      </ul>
    )
  }

  return <Section title={t('subscriptionsTitle')}>{renderBody()}</Section>
}

function SubscriptionItem({ item }: { item: BillingSubscriptionItemDTO }) {
  const t = useTranslations('Sobok.billing')
  const locale = useLocale()
  const { artist, subscription } = item
  const expiresAt = new Date(subscription.expiresAt)
  const live = expiresAt.getTime() > Date.now()
  const label = statusLabel()

  function statusLabel() {
    if (!live) {
      return t('expired')
    }

    if (subscription.autoRenew) {
      return t('nextBilling', { date: formatDate(expiresAt, locale), price: formatKRW(item.priceAmount, locale) })
    }

    return t('cancelScheduled', { date: formatDate(expiresAt, locale) })
  }

  return (
    <li>
      <Link
        href={`/sobok/@${artist.handle}`}
        className="flex items-center gap-3 rounded-xl border border-foreground/10 p-3.5 transition-colors hover:bg-foreground/5"
      >
        <Avatar imageURL={artist.imageURL} name={artist.displayName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {artist.displayName}
            {artist.emoji && <span className="ml-1">{artist.emoji}</span>}
          </p>
          <p data-live={live || undefined} className="mt-0.5 text-xs text-zinc-500 data-live:text-zinc-400">
            {label}
          </p>
        </div>
      </Link>
    </li>
  )
}

function PaymentMethodsSection({ loading }: { loading: boolean }) {
  const { billing, addCard, registerCard, registerError } = useAddCard()
  const { mutate: deletePaymentMethod, isPending: deleting } = useDeletePaymentMethodMutation()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const t = useTranslations('Sobok.billing')
  const errorMessage = issueError ?? (registerError instanceof Error ? registerError.message : null)

  async function handleAddCard() {
    setIssuing(true)
    setIssueError(null)

    try {
      await addCard(t('issueName'))
    } catch (caught) {
      setIssueError(caught instanceof Error ? caught.message : t('registerFailed'))
    } finally {
      setIssuing(false)
    }
  }

  // 모바일 빌링키 발급의 full-page redirect 복귀 — 카드 등록을 마저 진행한다.
  useBillingKeyRedirect({
    failedMessage: t('registerFailed'),
    onBillingKey: (billingKey) =>
      registerCard({ token: billingKey }).catch((caught) => {
        setIssueError(caught instanceof Error ? caught.message : t('registerFailed'))
      }),
    onError: setIssueError,
  })

  return (
    <Section title={t('methodsTitle')}>
      {loading ? (
        <div className="space-y-2">
          <CardRowSkeleton />
        </div>
      ) : (
        <ul className="space-y-2">
          {billing?.paymentMethods.map((method) => (
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

      <Button
        busy={issuing}
        className="mt-2 w-full border-dashed border-foreground/20 py-2.5 font-medium text-zinc-400 hover:border-indigo-500/50 hover:bg-transparent hover:text-indigo-400"
        onClick={() => void handleAddCard()}
        variant="outline"
      >
        {!issuing && <Plus className="h-4 w-4" />}
        {t('addCard')}
      </Button>
      <p className="mt-1.5 text-[11px] text-zinc-500">{t('cardFallbackNote')}</p>
    </Section>
  )
}

function PaymentHistorySection({ loading }: { loading: boolean }) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = usePaymentHistoryQuery()
  const t = useTranslations('Sobok.billing')
  const payments = data?.pages.flatMap((page) => page.payments) ?? []

  function renderBody() {
    if (loading) {
      return (
        <div className="space-y-2">
          <CardRowSkeleton />
          <CardRowSkeleton />
        </div>
      )
    }

    if (payments.length === 0) {
      return <p className="text-sm text-zinc-500">{t('historyEmpty')}</p>
    }

    return (
      <ul className="space-y-2">
        {payments.map((payment) => (
          <PaymentItem key={payment.id} payment={payment} />
        ))}
      </ul>
    )
  }

  return (
    <Section title={t('historyTitle')}>
      {renderBody()}

      {hasNextPage && (
        <Button
          busy={isFetchingNextPage}
          className="mt-2 w-full border-foreground/10 font-normal text-zinc-400 hover:bg-foreground/5"
          onClick={() => void fetchNextPage()}
          variant="outline"
        >
          {t('loadMore')}
        </Button>
      )}
    </Section>
  )
}

const PAYMENT_STATUS_TONE: Record<PaymentHistoryStatus, string> = {
  paid: 'text-emerald-400',
  failed: 'text-red-400',
  refunded: 'text-amber-400',
  pending: 'text-zinc-400',
}

function PaymentItem({ payment }: { payment: PaymentHistoryItemDTO }) {
  const t = useTranslations('Sobok.billing')
  const locale = useLocale()

  const statusTone = PAYMENT_STATUS_TONE[payment.status]
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
