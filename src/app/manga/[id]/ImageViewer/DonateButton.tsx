'use client'

import { Heart } from 'lucide-react'
import ms from 'ms'
import Link from 'next/link'
import { ComponentProps, useState } from 'react'
import { toast } from 'sonner'

import type { POSTV1PointsDonationCreateRequest } from '@/backend/api/v1/points/donations/POST'
import type { Manga } from '@/types/manga'

import { usePointsQuery } from '@/app/(navigation)/(top-navigation)/libo/usePointsQuery'
import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import useMeQuery from '@/query/useMeQuery'
import { formatNumber } from '@/utils/format/number'
import { ProblemDetailsError } from '@/utils/react-query-error'

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

  const { data: me } = useMeQuery()
  const { data: points, error: pointsError, isLoading: isPointsLoading } = usePointsQuery({ enabled: open })
  const donateMutation = usePointsDonateMutation()

  const remainingBalance = points ? points.balance - amount : null
  const isAmountValid = Number.isFinite(amount) && amount > 0 && Number.isInteger(amount)
  const canSubmit =
    selectedKeys.length > 0 && isAmountValid && !donateMutation.isPending && (points ? points.balance >= amount : true)

  function toKey(r: Pick<Recipient, 'type' | 'value'>) {
    return `${r.type}:${r.value}`
  }

  function getDisplayLabel(r: Recipient) {
    const trimmedLabel = r.label.trim()
    const isGenericLabel = trimmedLabel === (r.type === 'artist' ? '작가' : '단체') || trimmedLabel === '그룹'

    if (trimmedLabel && !isGenericLabel) {
      return trimmedLabel
    }

    const normalized = r.value.trim().replace(/^(artist:|group:)/, '')
    return normalized ? normalized.replace(/_/g, ' ') : r.type === 'artist' ? '작가' : '단체'
  }

  const recipients: Recipient[] = [
    ...(manga.artists?.map((artist) => ({ type: 'artist' as const, value: artist.value, label: artist.label })) ?? []),
    ...(manga.group?.map((group) => ({ type: 'group' as const, value: group.value, label: group.label })) ?? []),
  ]

  const selectedLookup = new Set(selectedKeys)
  const selectedRecipients: Recipient[] = recipients.filter((r) => selectedLookup.has(toKey(r)))

  function toggleRecipient(key: string) {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
    setLocalMessage(null)
  }

  function close() {
    setOpen(false)
    setLocalMessage(null)
  }

  function getErrorMessage(error: unknown): string | null {
    if (!error) return null
    if (error instanceof ProblemDetailsError) return error.problem.detail ?? error.problem.title
    if (error instanceof Error) return error.message
    return '문제가 발생했어요'
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLocalMessage(null)

    if (!isAmountValid) {
      setLocalMessage('기부 금액을 확인해 주세요')
      return
    }
    if (selectedRecipients.length === 0) {
      setLocalMessage('기부 대상을 선택해 주세요')
      return
    }

    const payload: POSTV1PointsDonationCreateRequest = {
      totalAmount: amount,
      recipients: selectedRecipients.map((r) => ({ type: r.type, value: r.value })),
    }

    donateMutation.mutate(payload, {
      onSuccess: () => {
        close()
        const donationHref = me?.name ? `/@${me.name}/donations` : '/ranking/donation'
        const donationLabel = me?.name ? '내 기부 보기' : '기부 랭킹 보기'
        const toastId = `donation-success-${manga.id}-${Date.now()}`

        toast.success(
          <div className="flex items-center justify-between gap-2 w-full">
            <span>기부가 완료됐어요</span>
            <Link
              className="text-xs font-semibold text-brand hover:underline"
              href={donationHref}
              onClick={() => toast.dismiss(toastId)}
              prefetch={false}
            >
              {donationLabel}
            </Link>
          </div>,
          { duration: ms('5 seconds'), id: toastId },
        )
      },
      onError: (err) => {
        setLocalMessage(getErrorMessage(err) ?? '기부에 실패했어요')
      },
    })
  }

  const pointsErrorMessage = getErrorMessage(pointsError)

  return (
    <>
      <button aria-label="기부하기" onClick={() => setOpen(true)} {...props}>
        <Heart className="size-6" />
      </button>
      <Dialog ariaLabel="기부하기" onClose={close} open={open}>
        <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
          <DialogHeader onClose={close} title="기부하기" />
          <DialogBody className="flex flex-col gap-4 sm:p-6">
            <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-400">현재 리보</p>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {isPointsLoading ? '불러오는 중' : points ? `${formatNumber(points.balance)} 리보` : '-'}
                </p>
              </div>
              {points && (
                <p
                  aria-current={remainingBalance !== null && remainingBalance < 0}
                  className="mt-2 text-xs text-zinc-500 aria-current:text-red-400"
                >
                  기부 후 남는 리보:{' '}
                  {remainingBalance === null ? '-' : `${formatNumber(Math.max(0, remainingBalance))} 리보`}
                </p>
              )}
              {pointsErrorMessage && <p className="mt-2 text-xs text-red-400">{pointsErrorMessage}</p>}
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-semibold text-foreground">대상</p>
              {recipients.length === 0 ? (
                <p className="text-sm text-zinc-500">이 작품에는 작가/단체 정보가 없어요</p>
              ) : (
                <div className="grid gap-2">
                  {recipients.map((r) => {
                    const key = toKey(r)
                    const isSelected = selectedKeys.includes(key)
                    return (
                      <button
                        aria-pressed={isSelected}
                        className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left text-sm transition
                        hover:border-zinc-700 aria-pressed:border-brand aria-pressed:bg-brand/10"
                        key={key}
                        onClick={() => toggleRecipient(key)}
                        title={getDisplayLabel(r)}
                        type="button"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-foreground truncate">{getDisplayLabel(r)}</span>
                          <span className="block text-xs text-zinc-500">{r.type === 'artist' ? '작가' : '단체'}</span>
                        </span>
                        <span className="shrink-0 text-xs text-zinc-500">{isSelected ? '선택됨' : '선택'}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-semibold text-foreground">금액</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    aria-current={amount === p}
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition
                    hover:border-zinc-700 aria-current:border-brand aria-current:bg-brand/10 aria-current:text-foreground"
                    key={p}
                    onClick={() => {
                      setAmount(p)
                      setLocalMessage(null)
                    }}
                    type="button"
                  >
                    {formatNumber(p)} 리보
                  </button>
                ))}
              </div>
              <label className="grid gap-1" htmlFor="donation-amount">
                <span className="text-xs text-zinc-500">직접 입력</span>
                <input
                  className="h-11 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-foreground outline-none focus:border-zinc-600"
                  id="donation-amount"
                  inputMode="numeric"
                  min={1}
                  name="donation-amount"
                  onChange={(e) => {
                    const next = Number(e.target.value)
                    setAmount(Number.isFinite(next) ? next : 0)
                    setLocalMessage(null)
                  }}
                  placeholder="예) 100"
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
              취소
            </button>
            <button
              aria-disabled={!canSubmit}
              className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-background transition aria-disabled:opacity-50 aria-disabled:pointer-events-none"
              type="submit"
            >
              {donateMutation.isPending ? '기부 중...' : '기부하기'}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
