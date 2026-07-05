'use client'

import type { POSTV1PointsDonationCreateRequest } from '@litomi/contracts'
import type { Manga } from '@litomi/domain/manga/model'

import { formatNumber } from '@litomi/std'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import ms from 'ms'
import { useLocale, useTranslations } from 'next-intl'
import { type ComponentProps, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { usePointsQuery } from '@/app/[locale]/(navigation)/(top-navigation)/libo/usePointsQuery'
import { useRouter } from '@/i18n/navigation'
import { getErrorMessage } from '@/lib/error-message'
import useMeQuery from '@/query/useMeQuery'

import usePointsDonateMutation from './usePointsDonateMutation'

interface Props extends ComponentProps<'button'> {
  manga: Manga
}

type Recipient = {
  type: 'artist' | 'group'
  value: string
  label: string
}

const PRESETS = [10, 50, 100, 300, 500] as const

export default function DonateButton({ manga, ...props }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState<number>(100)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [localMessage, setLocalMessage] = useState<string | null>(null)
  const locale = useLocale()
  const router = useRouter()
  const { data: me } = useMeQuery()
  const t = useTranslations('MangaViewer.donate')
  const tErrors = useTranslations('Errors')
  const donateMutation = usePointsDonateMutation()
  const { data: points, error: pointsError, isLoading: isPointsLoading } = usePointsQuery({ enabled: open })

  const remainingBalance = points ? points.balance - amount : null
  const isAmountValid = Number.isFinite(amount) && amount > 0 && Number.isInteger(amount)
  const selectedLookup = new Set(selectedKeys)

  const canSubmit =
    selectedKeys.length > 0 && isAmountValid && !donateMutation.isPending && (points ? points.balance >= amount : true)

  const recipients: Recipient[] = [
    ...(manga.artists?.map((artist) => ({
      type: 'artist' as const,
      value: artist.value,
      label: artist.label,
    })) ?? []),
    ...(manga.group?.map((group) => ({
      type: 'group' as const,
      value: group.value,
      label: group.label,
    })) ?? []),
  ]

  const selectedRecipients: Recipient[] = recipients.filter((r) => selectedLookup.has(`${r.type}:${r.value}`))

  function getRecipientTypeLabel(type: Recipient['type']) {
    return type === 'artist' ? t('recipientType.artist') : t('recipientType.group')
  }

  function getDisplayLabel(r: Recipient) {
    return formatRecipientText(r.label) || formatRecipientText(r.value) || getRecipientTypeLabel(r.type)
  }

  function toggleRecipient(key: string) {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
    setLocalMessage(null)
  }

  function close() {
    setOpen(false)
    setLocalMessage(null)
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setLocalMessage(null)

    if (!isAmountValid) {
      setLocalMessage(t('invalidAmount'))
      return
    }

    if (selectedRecipients.length === 0) {
      setLocalMessage(t('missingRecipient'))
      return
    }

    const payload: POSTV1PointsDonationCreateRequest = {
      totalAmount: amount,
      recipients: selectedRecipients.map((r) => ({ type: r.type, value: r.value })),
    }

    donateMutation.mutate(payload, {
      onSuccess: () => {
        close()
        const donationHref = me?.name ? '/donation' : '/ranking/donation'
        const donationLabel = me?.name ? '내 후원 보기' : '후원 랭킹 보기'
        const toastId = `donation-success-${manga.id}-${Date.now()}`

        toast.success('후원이 완료됐어요', {
          action: {
            label: donationLabel,
            onClick: () => {
              toast.dismiss(toastId)
              router.push(donationHref)
            },
          },
          duration: ms('5 seconds'),
          id: toastId,
        })
      },
      onError: (err) => {
        setLocalMessage(getErrorMessage(tErrors, err) ?? t('failure'))
      },
    })
  }

  const pointsErrorMessage = getErrorMessage(tErrors, pointsError)

  return (
    <>
      <button aria-label={t('action')} onClick={() => setOpen(true)} {...props}>
        {t('shortAction')}
      </button>
      <Dialog ariaLabel={t('action')} onClose={close} open={open}>
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader onClose={close} title={t('title')} />
          <DialogBody className="flex flex-col gap-4 sm:p-6">
            {t('description')}
            <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-400">{t('currentBalance')}</p>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {isPointsLoading
                    ? t('loading')
                    : points
                      ? t('liboAmount', { amount: formatNumber(points.balance, locale) })
                      : '-'}
                </p>
              </div>
              {points && (
                <p
                  aria-current={remainingBalance !== null && remainingBalance < 0}
                  className="mt-2 text-xs text-zinc-500 aria-current:text-red-400"
                >
                  {t('remainingBalance', {
                    amount: remainingBalance === null ? '-' : formatNumber(Math.max(0, remainingBalance), locale),
                  })}
                </p>
              )}
              {pointsErrorMessage && <p className="mt-2 text-xs text-red-400">{pointsErrorMessage}</p>}
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-foreground">{t('recipient')}</p>
              {recipients.length === 0 ? (
                <p className="text-sm text-zinc-500">{t('emptyRecipients')}</p>
              ) : (
                <div className="grid gap-2">
                  {recipients.map((r) => {
                    const recipientKey = `${r.type}:${r.value}`
                    const isSelected = selectedKeys.includes(recipientKey)
                    return (
                      <button
                        aria-pressed={isSelected}
                        className={twMerge(
                          'flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-sm transition',
                          'hover:border-zinc-700 aria-pressed:border-brand aria-pressed:bg-brand/10',
                        )}
                        key={recipientKey}
                        onClick={() => toggleRecipient(recipientKey)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-foreground truncate">{getDisplayLabel(r)}</span>
                          <span className="block text-xs text-zinc-500">{getRecipientTypeLabel(r.type)}</span>
                        </span>
                        <span className="shrink-0 text-xs text-zinc-500">
                          {isSelected ? t('selected') : t('select')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-foreground">{t('amount')}</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    aria-current={amount === p}
                    className={twMerge(
                      'rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition',
                      'hover:border-zinc-700 aria-current:border-brand aria-current:bg-brand/10 aria-current:text-foreground',
                    )}
                    key={p}
                    onClick={() => {
                      setAmount(p)
                      setLocalMessage(null)
                    }}
                    type="button"
                  >
                    {t('liboAmount', { amount: formatNumber(p, locale) })}
                  </button>
                ))}
              </div>
              <label className="grid gap-1" htmlFor="donation-amount">
                <span className="text-xs text-zinc-500">{t('customAmount')}</span>
                <input
                  className="h-11 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-foreground outline-none focus:border-zinc-600"
                  id="donation-amount"
                  inputMode="numeric"
                  min={1}
                  name="donation-amount"
                  onChange={(e) => {
                    const next = Number(e.target.value)
                    setAmount(Number.isFinite(next) ? next : 0)
                    setLocalMessage(null)
                  }}
                  placeholder={t('amountPlaceholder')}
                  type="number"
                  value={Number.isFinite(amount) ? amount : 0}
                />
              </label>
            </div>
            {localMessage && <p className="text-sm text-red-400">{localMessage}</p>}
          </DialogBody>
          <DialogFooter className="flex gap-2">
            <button
              className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition"
              onClick={close}
              type="button"
            >
              {t('cancel')}
            </button>
            <button
              aria-disabled={!canSubmit}
              className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-background transition aria-disabled:opacity-50 aria-disabled:pointer-events-none"
              type="submit"
            >
              {donateMutation.isPending ? t('submitting') : t('action')}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}

function formatRecipientText(value: string) {
  return value.trim().replaceAll('_', ' ')
}
