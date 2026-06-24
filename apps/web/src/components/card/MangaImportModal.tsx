'use client'

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { Loader2, UploadCloud } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useId, useMemo, useState } from 'react'
import { twMerge } from 'tailwind-merge'

import { parseMangaIds } from './parseMangaIds'

export type MangaIdActionModalProps = {
  open: boolean
  onClose: () => void
  onAfterClose?: () => void
  maxCount: number
  isPending: boolean
  onSubmit: (mangaIds: number[]) => void
}

export default function MangaImportModal({
  open,
  onClose,
  onAfterClose,
  maxCount,
  isPending,
  onSubmit,
}: MangaIdActionModalProps) {
  const [inputText, setInputText] = useState('')
  const helperTextId = useId()
  const inputId = useId()
  const mangaIds = useMemo(() => parseMangaIds(inputText), [inputText])
  const t = useTranslations('Common.mangaCard.importModal')

  const isOverLimit = mangaIds.length > maxCount
  const isSubmitDisabled = isPending || mangaIds.length === 0 || isOverLimit

  function handleSubmit(event?: SubmitEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (isSubmitDisabled) {
      return
    }

    onSubmit(mangaIds)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !isPending) {
      event.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    if (!open) {
      setInputText('')
    }
  }, [open])

  return (
    <Dialog ariaLabel={t('title')} onAfterClose={onAfterClose} onClose={onClose} open={open}>
      <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
        <DialogHeader onClose={onClose} title={t('title')} />

        <DialogBody className="space-y-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor={inputId}>
            {t('inputLabel')}
            <span aria-hidden="true" className="ml-2 text-xs text-zinc-500">
              {t('shortcutHint', {
                shortcut: typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl',
              })}
            </span>
          </label>
          <textarea
            aria-describedby={helperTextId}
            aria-label={t('inputLabel')}
            className={twMerge(
              'w-full min-h-32 max-h-96 mb-0 px-3 py-2 border-2 border-zinc-700 rounded-lg transition font-mono',
              'text-zinc-100 placeholder-zinc-500 focus:border-brand focus:outline-none',
            )}
            disabled={isPending}
            id={inputId}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            value={inputText}
          />
          <p className="sr-only" id={helperTextId}>
            {t('help')}
          </p>
        </DialogBody>

        <DialogFooter className="border-t-2 border-zinc-800">
          <button
            className={twMerge(
              'flex items-center justify-center gap-2 w-full px-4 py-3 text-background font-medium',
              'bg-brand rounded-lg transition hover:bg-brand/90',
              'disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed',
            )}
            disabled={isSubmitDisabled}
            type="submit"
          >
            {isPending ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
            <span>{mangaIds.length > 0 ? t('submitWithCount', { count: mangaIds.length }) : t('submit')}</span>
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
