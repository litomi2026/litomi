'use client'

import type { ChatSubscriptionDTO } from '@litomi/contracts'
import { Loader2, Settings } from 'lucide-react'
import { useState } from 'react'
import useCancelSubscriptionMutation from '../_query/useCancelSubscriptionMutation'
import useRefundSubscriptionMutation from '../_query/useRefundSubscriptionMutation'

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

  const isBusy = cancelling || refunding || resuming
  const refundError = error ? error.message : null
  const endsAt = new Date(subscription.expiresAt)

  function close() {
    setOpen(false)
    setConfirmingRefund(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="p-2 text-zinc-400 transition-colors hover:text-foreground"
        aria-label="구독 관리"
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
            {confirmingRefund ? (
              <>
                <p className="text-sm font-medium text-foreground">결제를 환불할까요?</p>
                <p className="mt-1 text-xs text-zinc-400">
                  이번 결제가 전액 환불되고 즉시 이용이 종료돼요. 결제 7일 이내이고 이번 결제 기간에 답장을 보내지 않은
                  경우에만 환불할 수 있어요.
                </p>
                {refundError && <p className="mt-2 text-xs text-red-400">{refundError}</p>}
                <button
                  type="button"
                  onClick={() => refundSubscription()}
                  disabled={isBusy}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/90 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                >
                  {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  환불받기
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingRefund(false)}
                  disabled={isBusy}
                  className="mt-2 w-full rounded-xl border border-foreground/15 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 disabled:opacity-60"
                >
                  돌아가기
                </button>
              </>
            ) : (
              <>
                {subscription.autoRenew ? (
                  <>
                    <p className="text-sm font-medium text-foreground">구독 중</p>
                    <p className="mt-1 text-xs text-zinc-400">다음 결제일: {formatDate(endsAt)}</p>
                    <button
                      type="button"
                      onClick={() => cancelSubscription()}
                      disabled={isBusy}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-foreground/15 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 disabled:opacity-60"
                    >
                      {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                      구독 해지하기
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">구독 해지 예정</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatDate(endsAt)}에 종료돼요. 그때까지 계속 이용할 수 있어요.
                    </p>
                    <button
                      type="button"
                      onClick={onResume}
                      disabled={isBusy}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:opacity-60"
                    >
                      {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                      구독 유지하기
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmingRefund(true)}
                  disabled={isBusy}
                  className="mt-2 w-full py-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  결제 환불 (청약철회)
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
