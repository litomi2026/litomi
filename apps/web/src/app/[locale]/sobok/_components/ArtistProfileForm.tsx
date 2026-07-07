'use client'

import type { ChatArtistMine } from '@litomi/contracts'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

export interface ArtistProfileFormValues {
  handle: string
  displayName: string
  description: string | null
  emoji: string | null
  // null = 미오픈, 0 = 무료 개방, 그 외 = 유료.
  priceAmount: number | null
  isActive: boolean
  agreeContentPolicy: boolean
}

// null(미오픈)/0(무료)/유료 세 상태를 폼에서 다루기 위한 모드.
type PriceMode = 'closed' | 'free' | 'paid'

interface Props {
  mode: 'create' | 'edit'
  initial?: ChatArtistMine
  // Loading state: the form structure is static, so it renders immediately with the fields
  // disabled and fills in once `initial` arrives (remount via key at the call site).
  disabled?: boolean
  onSubmit: (values: ArtistProfileFormValues) => void
  isPending: boolean
  error: string | null
  submitLabel: string
}

export default function ArtistProfileForm({
  mode,
  initial,
  disabled = false,
  onSubmit,
  isPending,
  error,
  submitLabel,
}: Props) {
  const t = useTranslations('Sobok.studio.form')
  const isCreate = mode === 'create'
  const [priceMode, setPriceMode] = useState<PriceMode>(() => toPriceMode(initial?.priceAmount))

  const priceModeLabel: Record<PriceMode, string> = {
    closed: t('priceModeClosed'),
    free: t('priceModeFree'),
    paid: t('priceModePaid'),
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isPending) {
      return
    }

    const formData = new FormData(e.currentTarget)
    const price = String(formData.get('priceAmount') ?? '')

    onSubmit({
      handle: String(formData.get('handle') ?? '').trim(),
      displayName: String(formData.get('displayName') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim() || null,
      emoji: String(formData.get('emoji') ?? '').trim() || null,
      priceAmount: priceMode === 'closed' ? null : priceMode === 'free' ? 0 : Number(price),
      isActive: isCreate || formData.get('isActive') === 'on',
      agreeContentPolicy: !isCreate || formData.get('agreeContentPolicy') === 'on',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <fieldset disabled={disabled} className="space-y-5 transition-opacity disabled:opacity-60">
        <label className="block">
          <span className="text-sm font-medium text-foreground">{t('handleLabel')}</span>
          <div className="mt-1.5 flex items-center rounded-xl bg-zinc-800 focus-within:ring-2 focus-within:ring-indigo-500/50">
            <span className="pl-4 text-sm text-zinc-500">/sobok/@</span>
            <input
              type="text"
              name="handle"
              defaultValue={initial?.handle}
              onInput={normalizeHandleCase}
              placeholder="handle"
              required
              minLength={3}
              maxLength={32}
              pattern="[a-z0-9](?:-?[a-z0-9])*"
              title={t('handleTitle')}
              className="w-full bg-transparent py-2.5 pr-4 pl-0.5 text-base text-foreground outline-none placeholder:text-zinc-500"
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{t('handleHelp')}</p>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">{t('nameLabel')}</span>
          <input
            type="text"
            name="displayName"
            defaultValue={initial?.displayName}
            placeholder={t('namePlaceholder')}
            required
            maxLength={64}
            className="mt-1.5 w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-base text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground">{t('emojiLabel')}</span>
          <input
            type="text"
            name="emoji"
            defaultValue={initial?.emoji ?? ''}
            placeholder="✨"
            maxLength={16}
            className="mt-1.5 w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-base text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-foreground">{t('priceLabel')}</span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(['closed', 'free', 'paid'] as const).map((m) => {
              const selected = priceMode === m

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPriceMode(m)}
                  className={twMerge(
                    'rounded-xl border py-2.5 text-sm font-medium transition-colors',
                    selected
                      ? 'border-indigo-500 bg-indigo-500/10 text-foreground'
                      : 'border-foreground/10 text-zinc-400 hover:border-foreground/25',
                  )}
                >
                  {priceModeLabel[m]}
                </button>
              )
            })}
          </div>
          {priceMode === 'paid' && (
            <input
              type="number"
              name="priceAmount"
              defaultValue={initial?.priceAmount ?? ''}
              placeholder={t('pricePlaceholder')}
              required
              min={1_000}
              max={1_000_000}
              step={100}
              className="mt-2 w-full rounded-xl bg-zinc-800 px-4 py-2.5 text-base text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
            />
          )}
          <p className="mt-1.5 text-xs text-zinc-500">{t('priceHelp')}</p>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground">{t('bioLabel')}</span>
          <textarea
            name="description"
            defaultValue={initial?.description ?? ''}
            placeholder={t('bioPlaceholder')}
            maxLength={500}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl bg-zinc-800 px-4 py-2.5 text-base text-foreground outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500/50"
          />
        </label>

        {isCreate ? (
          <label className="flex items-start gap-2.5 rounded-xl border border-foreground/10 p-3.5">
            <input type="checkbox" name="agreeContentPolicy" required className="mt-0.5 h-4 w-4 accent-indigo-500" />
            <span className="text-xs leading-relaxed text-zinc-400">{t('agreePolicy')}</span>
          </label>
        ) : (
          <label className="flex items-center justify-between rounded-xl border border-foreground/10 p-3.5">
            <span className="text-sm text-foreground">
              {t('activeLabel')}
              <span className="mt-0.5 block text-xs text-zinc-500">{t('activeHelp')}</span>
            </span>
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initial?.isActive}
              className="h-5 w-5 accent-indigo-500"
            />
          </label>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-3 font-semibold text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </fieldset>
    </form>
  )
}

// 핸들은 소문자 canonical — 입력 즉시 소문자로 정규화한다(state 없이 DOM 값 재작성).
function normalizeHandleCase(e: React.InputEvent<HTMLInputElement>) {
  const input = e.currentTarget
  const lower = input.value.toLowerCase()

  if (input.value !== lower) {
    const { selectionStart, selectionEnd } = input
    input.value = lower
    input.setSelectionRange(selectionStart, selectionEnd)
  }
}

function toPriceMode(priceAmount: number | null | undefined): PriceMode {
  if (priceAmount == null) {
    return 'closed'
  }

  return priceAmount === 0 ? 'free' : 'paid'
}
