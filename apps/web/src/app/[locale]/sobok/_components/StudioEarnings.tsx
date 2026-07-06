'use client'

import type { ChatPayoutDTO, ChatPayoutStatus } from '@litomi/contracts'
import { LOCALE_LANGUAGE_TAGS } from '@litomi/domain/locale'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { getErrorMessage } from '@/lib/error-message'
import { formatKRW } from '../_lib/format'
import useSavePayoutAccountMutation from '../_query/useSavePayoutAccountMutation'
import useStudioEarningsQuery from '../_query/useStudioEarningsQuery'
import Button from './ui/Button'
import Section from './ui/Section'
import Skeleton from './ui/Skeleton'

// The 수익 tab content — chrome belongs to StudioShell. Section titles and card labels are
// static, so they render immediately; only the unknown values shimmer.
export default function StudioEarnings() {
  const { data } = useStudioEarningsQuery()
  const t = useTranslations('Sobok.earnings')
  const locale = useLocale()

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-xl space-y-8 px-5 py-6">
        <Section title={t('thisMonth')}>
          <div className="rounded-2xl border border-foreground/10 bg-zinc-800/60 p-5">
            <p className="text-sm text-zinc-400">{t('estimatedPayout')}</p>
            {data ? (
              <p className="mt-1 text-3xl font-bold text-foreground">
                {formatKRW(data.currentMonth.estimatedPayableAmount, locale)}
              </p>
            ) : (
              <Skeleton className="mt-1 h-9 w-36" />
            )}
            {data ? (
              <p className="mt-2 text-xs text-zinc-500">
                {t('gross', { amount: formatKRW(data.currentMonth.grossAmount, locale) })}
                {data.currentMonth.refundAmount > 0 &&
                  ` · ${t('refund', { amount: formatKRW(data.currentMonth.refundAmount, locale) })}`}{' '}
                · {t('feeNote')}
              </p>
            ) : (
              <Skeleton className="mt-2 h-4 w-64 max-w-full" />
            )}
          </div>
        </Section>

        <PayoutAccountSection account={data?.account} loading={!data} />

        <Section title={t('historyTitle')}>
          <PayoutHistory payouts={data?.payouts} />
        </Section>
      </div>
    </div>
  )
}

function PayoutHistory({ payouts }: { payouts?: ChatPayoutDTO[] }) {
  const t = useTranslations('Sobok.earnings')

  if (!payouts) {
    return <Skeleton className="h-24 rounded-xl" />
  }

  if (payouts.length === 0) {
    return <p className="text-sm text-zinc-500">{t('historyEmpty')}</p>
  }

  return (
    <ul className="space-y-2">
      {payouts.map((payout) => (
        <PayoutItem key={payout.periodStart} payout={payout} />
      ))}
    </ul>
  )
}

const PAYOUT_STATUS_TONE: Record<ChatPayoutStatus, string> = {
  paid: 'text-emerald-400',
  pending: 'text-indigo-400',
  carried: 'text-zinc-400',
}

type PayoutItemProps = {
  payout: ChatPayoutDTO
}

function PayoutItem({ payout }: PayoutItemProps) {
  const locale = useLocale()
  const t = useTranslations('Sobok.earnings')

  const period = new Date(payout.periodStart)
  const statusTone = PAYOUT_STATUS_TONE[payout.status]

  return (
    <li className="rounded-xl border border-foreground/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {period.toLocaleDateString(LOCALE_LANGUAGE_TAGS[locale], { year: 'numeric', month: 'long' })}
        </span>
        <span className={`text-xs font-semibold ${statusTone}`}>{t(`status.${payout.status}`)}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">{formatKRW(payout.payableAmount, locale)}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {t('gross', { amount: formatKRW(payout.grossAmount, locale) })}
        {payout.refundAmount > 0 && ` − ${t('refund', { amount: formatKRW(payout.refundAmount, locale) })}`} −{' '}
        {t('fee', { amount: formatKRW(payout.feeAmount, locale) })} −{' '}
        {t('withholding', { amount: formatKRW(payout.withholdingAmount, locale) })}
        {payout.carriedInAmount !== 0 &&
          ` ${payout.carriedInAmount > 0 ? '+' : '−'} ${t('carriedAmount', {
            amount: formatKRW(Math.abs(payout.carriedInAmount), locale),
          })}`}
        {payout.paidAt &&
          ` · ${t('paidOn', { date: new Date(payout.paidAt).toLocaleDateString(LOCALE_LANGUAGE_TAGS[locale]) })}`}
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
  loading: boolean
}

function PayoutAccountSection({ account, loading }: PayoutAccountSectionProps) {
  const [editing, setEditing] = useState(false)
  const { mutate: saveAccount, isPending, error } = useSavePayoutAccountMutation()
  const t = useTranslations('Sobok.earnings')
  const tErrors = useTranslations('Errors')
  const errorMessage = getErrorMessage(tErrors, error)

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isPending) {
      return
    }

    const formData = new FormData(e.currentTarget)

    const variables = {
      bankName: String(formData.get('bankName') ?? '').trim(),
      accountNumber: String(formData.get('accountNumber') ?? '').trim(),
      holderName: String(formData.get('holderName') ?? '').trim(),
    }

    saveAccount(variables, { onSuccess: () => setEditing(false) })
  }

  return (
    <Section title={t('accountTitle')}>
      {loading && <Skeleton className="h-18 rounded-xl" />}

      {!loading && !editing && account && (
        <div className="flex items-center justify-between rounded-xl border border-foreground/10 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {account.bankName} {account.accountNumberMasked}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{t('accountHolder', { name: account.holderName })}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            {t('change')}
          </button>
        </div>
      )}

      {!loading && !editing && !account && (
        <div className="rounded-xl border border-foreground/10 p-4">
          <p className="text-sm text-zinc-400">{t('accountMissing')}</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            {t('registerAccount')}
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-foreground/10 p-4">
          <input
            type="text"
            name="bankName"
            placeholder={t('bankNamePlaceholder')}
            required
            maxLength={32}
            className="w-full rounded-lg bg-zinc-800 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
          <input
            type="text"
            name="accountNumber"
            placeholder={t('accountNumberPlaceholder')}
            required
            pattern="[0-9-]{6,32}"
            maxLength={32}
            title={t('invalidAccountNumber')}
            className="w-full rounded-lg bg-zinc-800 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
          <input
            type="text"
            name="holderName"
            placeholder={t('holderNamePlaceholder')}
            required
            maxLength={32}
            className="w-full rounded-lg bg-zinc-800 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
          {errorMessage && <p className="text-xs text-red-400">{errorMessage}</p>}
          <div className="flex gap-2">
            <Button busy={isPending} className="flex-1 rounded-lg" type="submit">
              {t('save')}
            </Button>
            <Button
              className="flex-1 rounded-lg font-medium"
              disabled={isPending}
              onClick={() => setEditing(false)}
              variant="outline"
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      )}
    </Section>
  )
}
