'use client'

import { UploadCloud } from 'lucide-react'

import { useImportMangaModalStore } from './MangaImportModal'

type Props = {
  libraryId?: number
  className?: string
  variant?: 'button' | 'icon'
}

export default function MangaImportButton({ libraryId, className = '' }: Props) {
  const openImportModal = useImportMangaModalStore((store) => store.setLibraryId)

  return (
    <button
      aria-disabled={!libraryId}
      className={`p-2.5 rounded-lg aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent hover:bg-zinc-800 transition ${className}`}
      onClick={() => libraryId && openImportModal(libraryId)}
      title={libraryId ? '만화 가져오기' : '서재를 선택해 주세요'}
    >
      <UploadCloud className="size-6" />
    </button>
  )
}
