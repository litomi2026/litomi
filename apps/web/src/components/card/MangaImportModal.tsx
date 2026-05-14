'use client'

import Dialog from '@litomi/ui/dialog'
import DialogBody from '@litomi/ui/dialog-body'
import DialogFooter from '@litomi/ui/dialog-footer'
import DialogHeader from '@litomi/ui/dialog-header'
import { Loader2, UploadCloud } from 'lucide-react'
import { SubmitEvent, useEffect, useId, useMemo, useState } from 'react'

import { parseMangaIds } from './parseMangaIds'

const DIALOG_TITLE = '작품 가져오기'
const INPUT_LABEL = '작품 ID 입력'

const PLACEHOLDER = `1234567
8879273
2345678, 3456789, 18827

쉼표, 공백, 여러 줄로 구분해서 입력하기`

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
  const inputId = useId()
  const helperTextId = useId()
  const [inputText, setInputText] = useState('')

  const mangaIds = useMemo(() => parseMangaIds(inputText), [inputText])
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
    <Dialog ariaLabel={DIALOG_TITLE} onAfterClose={onAfterClose} onClose={onClose} open={open}>
      <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
        <DialogHeader onClose={onClose} title={DIALOG_TITLE} />

        <DialogBody className="space-y-4">
          <label className="block text-sm font-medium text-zinc-300 mb-2" htmlFor={inputId}>
            {INPUT_LABEL}
            <span aria-hidden="true" className="ml-2 text-xs text-zinc-500">
              {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}+Enter로 제출 가능
            </span>
          </label>
          <textarea
            aria-describedby={helperTextId}
            aria-label={INPUT_LABEL}
            className="w-full min-h-32 max-h-96 mb-0 px-3 py-2 border-2 border-zinc-700 rounded-lg transition font-mono
              text-zinc-100 placeholder-zinc-500 focus:border-brand focus:outline-none"
            disabled={isPending}
            id={inputId}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER}
            value={inputText}
          />
          <p className="sr-only" id={helperTextId}>
            숫자로 된 작품 ID를 붙여넣으면 자동으로 감지해요.
          </p>
        </DialogBody>

        <DialogFooter className="border-t-2 border-zinc-800">
          <button
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-background font-medium
              bg-brand rounded-lg transition hover:bg-brand/90
              disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
            disabled={isSubmitDisabled}
            type="submit"
          >
            {isPending ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
            <span>{mangaIds.length > 0 ? `${mangaIds.length.toLocaleString()}개 가져오기` : '가져오기'}</span>
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
