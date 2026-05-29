'use client'

import { UploadCloud } from 'lucide-react'

import { getStatusActionClassName } from '@/components/status/styles'

import { useBookmarkImportModalStore } from './store'

type Props = {
  variant?: 'cta' | 'icon' | 'toolbar'
}

const TOOLBAR_BUTTON_CLASS_NAME =
  'flex items-center gap-2 text-sm font-semibold border-2 border-zinc-700 rounded-xl w-fit px-2.5 py-1.5 transition bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-zinc-600 active:bg-zinc-800 disabled:text-zinc-500 disabled:bg-zinc-800/30 disabled:border-zinc-800'

const CTA_BUTTON_CLASS_NAME = getStatusActionClassName('tertiary', 'max-w-none')

const ICON_BUTTON_CLASS_NAME =
  'rounded-lg p-3 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50'

export default function BookmarkImportButton({ variant = 'toolbar' }: Props) {
  const setIsOpen = useBookmarkImportModalStore((store) => store.setIsOpen)

  const className = {
    cta: CTA_BUTTON_CLASS_NAME,
    icon: ICON_BUTTON_CLASS_NAME,
    toolbar: TOOLBAR_BUTTON_CLASS_NAME,
  }[variant]

  return (
    <button
      aria-label="ID로 추가"
      className={className}
      onClick={() => setIsOpen(true)}
      title="ID로 추가"
      type="button"
    >
      <span className="flex items-center justify-center gap-2">
        <UploadCloud className="size-5 shrink-0" />
        {variant === 'cta' ? (
          <span>작품 ID로 여러 개 추가</span>
        ) : variant === 'icon' ? (
          <span className="sr-only">ID로 추가</span>
        ) : (
          <span className="hidden md:block">ID로 추가</span>
        )}
      </span>
    </button>
  )
}
