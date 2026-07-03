'use client'

import type { ChatPayoutDTO, ChatPayoutStatus } from '@litomi/contracts'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import useSavePayoutAccountMutation from '../_query/useSavePayoutAccountMutation'
import useStudioEarningsQuery from '../_query/useStudioEarningsQuery'

const PAYOUT_STATUS_LABELS: Record<ChatPayoutStatus, string> = {
  pending: '지급 대기',
  paid: '지급 완료',
  carried: '이월',
}

type Props = {
  handle: string
}

export default function StudioEarnings({ handle }: Props) {
  const { data, isLoading } = useStudioEarningsQuery()

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-14 shrink-0 flex items-center px-2 border-b border-foreground/10 bg-background/80">
        <Link href={`/sobok/studio/${handle}`} className="p-2 text-zinc-400 hover:text-foreground transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h2 className="font-bold text-lg text-foreground ml-2">정산 · 수익</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading || !data ? (
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-500/30" />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-md space-y-8 px-5 py-6">
            <section>
              <h3 className="text-sm font-semibold text-zinc-400">이번 달</h3>
              <div className="mt-2 rounded-2xl border border-foreground/10 bg-zinc-800/60 p-5">
                <p className="text-sm text-zinc-400">예상 지급액</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {formatKRW(data.currentMonth.estimatedPayableAmount)}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  수납 {formatKRW(data.currentMonth.grossAmount)}
                  {data.currentMonth.refundAmount > 0 && ` · 환불 ${formatKRW(data.currentMonth.refundAmount)}`} ·
                  수수료 25%와 원천징수 3.3%를 뺀 금액이에요. 다음 달 초에 정산돼요.
                </p>
              </div>
            </section>

            <PayoutAccountSection account={data.account} />

            <section>
              <h3 className="text-sm font-semibold text-zinc-400">정산 내역</h3>
              {data.payouts.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">아직 정산 내역이 없어요. 매월 초에 지난달이 정산돼요.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {data.payouts.map((payout) => (
                    <PayoutItem key={payout.periodStart} payout={payout} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

type PayoutItemProps = {
  payout: ChatPayoutDTO
}

function PayoutItem({ payout }: PayoutItemProps) {
  const period = new Date(payout.periodStart)

  const statusTone =
    payout.status === 'paid' ? 'text-emerald-400' : payout.status === 'pending' ? 'text-indigo-400' : 'text-zinc-400'

  return (
    <li className="rounded-xl border border-foreground/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {period.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </span>
        <span className={`text-xs font-semibold ${statusTone}`}>{PAYOUT_STATUS_LABELS[payout.status]}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">{formatKRW(payout.payableAmount)}</p>
      <p className="mt-1 text-xs text-zinc-500">
        수납 {formatKRW(payout.grossAmount)}
        {payout.refundAmount > 0 && ` − 환불 ${formatKRW(payout.refundAmount)}`} − 수수료 {formatKRW(payout.feeAmount)}{' '}
        − 원천징수 {formatKRW(payout.withholdingAmount)}
        {payout.carriedInAmount !== 0 &&
          ` ${payout.carriedInAmount > 0 ? '+' : '−'} 이월 ${formatKRW(Math.abs(payout.carriedInAmount))}`}
        {payout.paidAt && ` · ${new Date(payout.paidAt).toLocaleDateString('ko-KR')} 지급`}
      </p>
    </li>
  )
}

type PayoutAccountSectionProps = {
  account?: {
    bankName: string
    accountNumberMasked: string
    holderName: string
  }
}

function PayoutAccountSection({ account }: PayoutAccountSectionProps) {
  const { mutate: saveAccount, isPending, error } = useSavePayoutAccountMutation()
  const [editing, setEditing] = useState(false)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [holderName, setHolderName] = useState('')

  const canSave = !isPending && bankName.trim() && accountNumber.trim() && holderName.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!canSave) {
      return
    }

    saveAccount(
      { bankName: bankName.trim(), accountNumber: accountNumber.trim(), holderName: holderName.trim() },
      { onSuccess: () => setEditing(false) },
    )
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-400">입금 계좌</h3>

      {!editing && account && (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-foreground/10 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {account.bankName} {account.accountNumberMasked}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">예금주 {account.holderName}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            변경
          </button>
        </div>
      )}

      {!editing && !account && (
        <div className="mt-2 rounded-xl border border-foreground/10 p-4">
          <p className="text-sm text-zinc-400">정산받을 계좌를 등록해 주세요. 계좌가 없으면 지급이 보류돼요.</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            계좌 등록하기
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-3 rounded-xl border border-foreground/10 p-4">
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="은행명"
            maxLength={32}
            className="w-full rounded-lg bg-zinc-800 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="계좌번호 (숫자와 - 만)"
            maxLength={32}
            className="w-full rounded-lg bg-zinc-800 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
          <input
            type="text"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="예금주"
            maxLength={32}
            className="w-full rounded-lg bg-zinc-800 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
          {error instanceof Error && <p className="text-xs text-red-400">{error.message}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!canSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              저장
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={isPending}
              className="flex-1 rounded-lg border border-foreground/15 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50 disabled:opacity-60"
            >
              취소
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function formatKRW(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}
