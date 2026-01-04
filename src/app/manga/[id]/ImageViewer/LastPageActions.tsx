'use client'

import { LibraryBig, MessageCircle } from 'lucide-react'
import Link from 'next/link'

import BookmarkButton from '@/components/card/BookmarkButton'
import { useLibraryModal } from '@/components/card/LibraryModal'
import MangaReportButton from '@/components/report/MangaReportButton'
import { showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'

type Props = {
  manga: { id: number }
}

export default function LastPageActions({ manga }: Readonly<Props>) {
  const { id: mangaId } = manga
  const { data: me } = useMeQuery()
  const { open: openLibraryModal } = useLibraryModal()

  function handleOpenLibraryModal(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!me) {
      e.preventDefault()
      showLoginRequiredToast()
      return
    }

    openLibraryModal(mangaId)
  }

  return (
    <div className="w-full max-w-sm space-y-2 text-sm font-medium">
      <div className="grid grid-cols-2 items-center gap-2 text-foreground">
        <div className="col-span-2">
          <BookmarkButton
            className="p-4 w-full py-2 rounded-lg bg-foreground text-background font-semibold hover:bg-foreground/90 active:bg-foreground/80 transition
              disabled:bg-foreground/30 disabled:text-background/60 disabled:cursor-not-allowed disabled:hover:bg-foreground/30
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
            manga={manga}
          />
        </div>
        <button
          className="flex items-center justify-center gap-2 w-full p-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
          onClick={handleOpenLibraryModal}
          type="button"
        >
          <LibraryBig className="size-4" />
          <span>서재 추가</span>
        </button>
        <Link
          className="flex justify-center items-center gap-2 p-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
          href={`/manga/${mangaId}/detail`}
          onClick={(e) => e.stopPropagation()}
          prefetch={false}
        >
          <MessageCircle className="size-4" />
          작품 후기
        </Link>
      </div>
      <div className="flex justify-center">
        <MangaReportButton
          className="w-auto border-0 px-2 py-1 text-xs text-zinc-500 hover:bg-transparent hover:text-foreground [&>svg]:hidden"
          mangaId={mangaId}
          variant="full"
        />
      </div>
    </div>
  )
}
