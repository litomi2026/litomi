'use client'

import type { ChatSubscriptionDTO } from '@litomi/contracts'
import { Loader2, Settings } from 'lucide-react'
import { useState } from 'react'

interface Props {
  subscription: ChatSubscriptionDTO
  onCancel: () => void
  onResume: () => void
  isBusy: boolean
}

export default function SubscriptionMenu({ subscription, onCancel, onResume, isBusy }: Props) {
  const [open, setOpen] = useState(false)
  const endsAt = new Date(subscription.expiresAt)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
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
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-2xl border border-foreground/10 bg-zinc-800 p-4 shadow-xl">
            {subscription.autoRenew ? (
              <>
                <p className="text-sm font-medium text-foreground">구독 중</p>
                <p className="mt-1 text-xs text-zinc-400">다음 결제일: {formatDate(endsAt)}</p>
                <button
                  type="button"
                  onClick={onCancel}
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
          </div>
        </>
      )}
    </div>
  )
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
