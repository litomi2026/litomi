'use client'

import { Upload } from 'lucide-react'

import { useBookmarkUploadModalStore } from './store'

type Props = {
  variant?: 'cta' | 'toolbar'
}

const TOOLBAR_BUTTON_CLASS_NAME =
  'flex items-center gap-2 text-sm font-semibold border-2 border-zinc-700 rounded-xl w-fit px-2.5 py-1.5 transition bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-zinc-600 active:bg-zinc-800 disabled:text-zinc-500 disabled:bg-zinc-800/30 disabled:border-zinc-800'

const CTA_BUTTON_CLASS_NAME =
  'w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-6 py-3 font-semibold text-zinc-100 transition hover:border-zinc-700 hover:bg-zinc-800'

export default function BookmarkUploadButton({ variant = 'toolbar' }: Readonly<Props>) {
  const setIsOpen = useBookmarkUploadModalStore((store) => store.setIsOpen)

  const className = {
    cta: CTA_BUTTON_CLASS_NAME,
    toolbar: TOOLBAR_BUTTON_CLASS_NAME,
  }[variant]

  return (
    <button className={className} onClick={() => setIsOpen(true)} type="button">
      <span className="flex items-center justify-center gap-2">
        <Upload className="size-5 shrink-0" />
        {variant === 'cta' ? <span>내보낸 북마크 복원</span> : <span className="hidden md:block">북마크 복원</span>}
      </span>
    </button>
  )
}
