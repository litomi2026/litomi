'use client'

import bookmarkManga from '@/app/(navigation)/[userId]/bookmark/action'
import useBookmarksQuery from '@/query/useBookmarksQuery'
import useMeQuery from '@/query/useMeQuery'
import { Manga } from '@/types/manga'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import IconBookmark from '../icons/IconBookmark'
import LoginLink from '../LoginLink'

const initialState = {} as Awaited<ReturnType<typeof bookmarkManga>>

type Props = {
  manga: Manga
}

export default function BookmarkButton({ manga }: Props) {
  const { data: me } = useMeQuery()
  const { data: bookmarks } = useBookmarksQuery()
  const [{ error, success, isBookmarked }, formAction, isPending] = useActionState(bookmarkManga, initialState)
  const isIconSelected = isBookmarked ?? bookmarks?.has(manga.id)

  useEffect(() => {
    if (error) {
      toast.error(error.mangaId?.[0] ?? error.userId?.[0])
    }
  }, [error])

  useEffect(() => {
    if (success) {
      toast.success(isBookmarked ? '북마크를 추가했어요' : '북마크를 삭제했어요')
    }
  }, [success, isBookmarked])

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!me) {
      event.preventDefault()
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>먼저 로그인 해주세요.</div>
          <LoginLink>로그인하기</LoginLink>
        </div>,
      )
    }
  }

  return (
    <form action={formAction}>
      <input name="mangaId" type="hidden" value={manga.id} />
      <button
        aria-disabled={!me}
        className="flex items-center gap-1 border-2 w-fit border-zinc-800 rounded-lg p-1 px-2 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-900 transition"
        disabled={isPending}
        onClick={handleClick}
        type="submit"
      >
        <IconBookmark className="w-5" selected={isIconSelected} />
        <span className="hidden md:block">북마크</span>
      </button>
    </form>
  )
}

export function BookmarkButtonError({ reset }: ErrorBoundaryFallbackProps) {
  return (
    <button
      className="flex items-center gap-1 border-2 w-fit border-red-800 rounded-lg p-1 px-2 transition"
      onClick={reset}
    >
      <IconBookmark className="w-5 text-red-700" />
      <span className="hidden md:block text-red-700">오류</span>
    </button>
  )
}

export function BookmarkButtonSkeleton() {
  return (
    <button
      className="flex items-center gap-1 border-2 w-fit border-zinc-800 rounded-lg p-1 px-2 bg-zinc-900 transition"
      disabled
    >
      <IconBookmark className="w-5" />
      <span className="hidden md:block">북마크</span>
    </button>
  )
}
