'use client'

import { LibraryBig, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import BookmarkButton from '@/components/card/BookmarkButton'
import { useLibraryModal } from '@/components/card/LibraryModal'
import LoginPageLink from '@/components/LoginPageLink'
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
      const toastId = toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요</div>
          <LoginPageLink onClick={() => toast.dismiss(toastId)}>로그인하기</LoginPageLink>
        </div>,
      )
      return
    }

    openLibraryModal(mangaId)
  }

  return (
    <div className="w-full max-w-sm space-y-2 text-sm font-medium">
      <button
        className="flex items-center justify-center gap-2 w-full p-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
        onClick={handleOpenLibraryModal}
        type="button"
      >
        <LibraryBig className="size-4" />
        <span>서재에 추가</span>
      </button>
      <div className="grid grid-cols-2 items-center gap-2 text-foreground">
        <Link
          className="flex justify-center items-center gap-2 p-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
          href={`/manga/${mangaId}/detail`}
          onClick={(e) => e.stopPropagation()}
          prefetch={false}
        >
          <MessageCircle className="size-4" />
          작품 후기
        </Link>
        <BookmarkButton
          className="p-4 w-full py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
          manga={manga}
        />
      </div>
    </div>
  )
}
