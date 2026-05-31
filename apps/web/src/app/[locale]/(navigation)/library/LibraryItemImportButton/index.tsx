'use client'

import { UploadCloud } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useImportMangaModalStore } from './store'

type Props = {
  libraryId?: number
  className?: string
  variant?: 'button' | 'icon'
}

export default function LibraryItemImportButton({ libraryId, className = '' }: Props) {
  const openImportModal = useImportMangaModalStore((store) => store.setLibraryId)
  const t = useTranslations('Library.import')

  return (
    <button
      aria-disabled={!libraryId}
      className={`p-2.5 rounded-lg aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent hover:bg-zinc-800 transition ${className}`}
      onClick={() => libraryId && openImportModal(libraryId)}
      title={libraryId ? t('buttonTitle') : t('selectLibraryTitle')}
    >
      <UploadCloud className="size-6" />
    </button>
  )
}
