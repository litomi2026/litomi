'use client'

import type { BillingSubscriptionItemDTO, PaymentHistoryItemDTO, PaymentHistoryStatus } from '@litomi/contracts'
import { ChevronLeft, CreditCard, Loader2, Plus, Receipt, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useEffectEvent, useState } from 'react'
import { consumeBillingKeyRedirect, requestBillingKeyIssuance } from '../_lib/billing'
import { avatarURL } from '../_lib/chat'
import useAddPaymentMethodMutation from '../_query/useAddPaymentMethodMutation'
import useBillingSubscriptionsQuery from '../_query/useBillingSubscriptionsQuery'
import useDeletePaymentMethodMutation from '../_query/useDeletePaymentMethodMutation'
import usePaymentHistoryQuery from '../_query/usePaymentHistoryQuery'
import usePaymentMethodsQuery from '../_query/usePaymentMethodsQuery'

const PAYMENT_STATUS_LABELS: Record<PaymentHistoryStatus, string> = {
  pending: '처리 중',
  paid: '결제 완료',
  failed: '실패',
  refunded: '환불됨',
}

export default function BillingHub() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10 bg-background/80">
        <Link href="/sobok" className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h2 className="font-bold text-lg text-foreground ml-2">결제 관리</h2>
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
  const subscriptions = data?.subscriptions ?? []

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-400">구독</h3>
      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">불러오는 중...</p>
      ) : subscriptions.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">구독 중인 아티스트가 없어요.</p>
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
  const { artist, subscription } = item
  const expiresAt = new Date(subscription.expiresAt)
  const live = expiresAt.getTime() > Date.now()

  const label = live
    ? subscription.autoRenew
      ? `다음 결제 ${formatDate(expiresAt)} · ${formatKRW(item.priceAmount)}/월`
      : `해지 예정 · ${formatDate(expiresAt)}까지`
    : '만료됨'

  return (
    <li>
      <Link
        href={`/sobok/${artist.handle}`}
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
  const errorMessage = issueError ?? (registerError instanceof Error ? registerError.message : null)

  // 모바일 빌링키 발급의 full-page redirect 복귀 — 카드 등록을 마저 진행한다.
  const resumeCardRegistration = useEffectEvent(() => {
    const result = consumeBillingKeyRedirect()

    if (!result) {
      return
    }

    if ('billingKey' in result) {
      registerPaymentMethod({ token: result.billingKey }).catch((caught) => {
        setIssueError(caught instanceof Error ? caught.message : '결제수단 등록에 실패했어요.')
      })
    } else {
      setIssueError(result.errorMessage)
    }
  })

  async function handleAddCard() {
    if (!data?.storeId || !data.channelKey) {
      setIssueError('결제가 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    setIssuing(true)
    setIssueError(null)

    try {
      const billingKey = await requestBillingKeyIssuance({
        storeId: data.storeId,
        channelKey: data.channelKey,
        issueName: '결제수단 등록',
      })

      await registerPaymentMethod({ token: billingKey })
    } catch (caught) {
      setIssueError(caught instanceof Error ? caught.message : '결제수단 등록에 실패했어요.')
    } finally {
      setIssuing(false)
    }
  }

  useEffect(() => {
    resumeCardRegistration()
  }, [])

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-400">결제수단</h3>

      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">불러오는 중...</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {data?.paymentMethods.map((method) => (
            <li key={method.id} className="flex items-center gap-3 rounded-xl border border-foreground/10 p-3.5">
              <CreditCard className="h-5 w-5 shrink-0 text-zinc-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {method.brand ?? '카드'}
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
                    삭제 확인
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    disabled={deleting}
                    className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(method.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  aria-label="결제수단 삭제"
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
        카드 추가
      </button>
      <p className="mt-1.5 text-[11px] text-zinc-500">
        구독에 쓰던 카드를 삭제하면 다음 결제부터 가장 최근에 등록한 카드로 자동 결제돼요.
      </p>
    </section>
  )
}

function PaymentHistorySection() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = usePaymentHistoryQuery()
  const payments = data?.pages.flatMap((page) => page.payments) ?? []

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-400">결제 내역</h3>

      {isLoading ? (
        <p className="mt-2 text-sm text-zinc-500">불러오는 중...</p>
      ) : payments.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">아직 결제 내역이 없어요.</p>
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
          더보기
        </button>
      )}
    </section>
  )
}

function PaymentItem({ payment }: { payment: PaymentHistoryItemDTO }) {
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
        <span className={`shrink-0 text-xs font-semibold ${statusTone}`}>{PAYMENT_STATUS_LABELS[payment.status]}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {formatKRW(payment.amount)}
          {partiallyRefunded && ` (환불 ${formatKRW(payment.refundedAmount)})`}
          {' · '}
          {formatDate(new Date(payment.paidAt ?? payment.createdAt))}
        </p>
        {showReceipt && (
          <a
            href={`/api/v1/billing/payments/${payment.paymentId}/receipt`}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            <Receipt className="h-3.5 w-3.5" />
            영수증
          </a>
        )}
      </div>
    </li>
  )
}

function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
