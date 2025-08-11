'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import toggleBookmark from '@/app/(navigation)/(right-search)/[name]/bookmark/action'
import { GETBookmarksResponse } from '@/app/api/bookmark/route'
import { QueryKeys } from '@/constants/query'
import useActionErrorEffect from '@/hook/useActionErrorEffect'
import useBookmarksQuery from '@/query/useBookmarksQuery'
import useMeQuery from '@/query/useMeQuery'
import { Manga } from '@/types/manga'

import IconBookmark from '../icons/IconBookmark'
import LoginLink from '../LoginLink'

const initialState = {} as Awaited<ReturnType<typeof toggleBookmark>>

type BookmarkButtonSkeletonProps = {
  className?: string
}

type Props = {
  manga: Manga
  className?: string
}

export default function BookmarkButton({ manga, className }: Readonly<Props>) {
  const { id: mangaId } = manga
  const { data: me } = useMeQuery()
  const { data: bookmarks } = useBookmarksQuery()
  const [{ status, data, message }, formAction, isPending] = useActionState(toggleBookmark, initialState)
  const bookmarkIds = useMemo(() => new Set(bookmarks?.bookmarks.map((bookmark) => bookmark.mangaId)), [bookmarks])
  const isIconSelected = bookmarkIds.has(mangaId)
  const queryClient = useQueryClient()

  useActionErrorEffect({
    status,
    error: message,
    onError: (error) => toast.error(error),
  })

  useEffect(() => {
    if (!data) {
      return
    }

    // NOTE: isBookmarked=true 일 때 createdAt 항상 있음
    const { isBookmarked, createdAt = 0 } = data
    toast.success(data.isBookmarked ? '북마크를 추가했어요' : '북마크를 삭제했어요')

    queryClient.setQueryData<GETBookmarksResponse>(QueryKeys.bookmarks, (oldBookmarks) => {
      const newBookmark = { mangaId, createdAt }

      if (!oldBookmarks) {
        return {
          bookmarks: [newBookmark],
          nextCursor: null,
        }
      } else if (isBookmarked) {
        return {
          bookmarks: [newBookmark, ...oldBookmarks.bookmarks],
          nextCursor: null,
        }
      } else {
        return {
          bookmarks: oldBookmarks.bookmarks.filter((bookmark) => bookmark.mangaId !== mangaId),
          nextCursor: null,
        }
      }
    })

    if (isBookmarked) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarks })
    }
  }, [data, queryClient, mangaId])

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!me) {
      event.preventDefault()
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인 해주세요.</div>
          <LoginLink>로그인하기</LoginLink>
        </div>,
      )
    }
  }

  return (
    <form action={formAction} className={className}>
      <input name="mangaId" type="hidden" value={mangaId} />
      <button
        className="flex justify-center items-center gap-1 w-full h-full transition disabled:bg-zinc-900 disabled:cursor-not-allowed"
        disabled={isPending}
        onClick={handleClick}
        type="submit"
      >
        <IconBookmark className="w-4" selected={isIconSelected} />
        <span>북마크</span>
      </button>
    </form>
  )
}

export function BookmarkButtonError({ error, reset }: Readonly<ErrorBoundaryFallbackProps>) {
  useEffect(() => {
    captureException(error, { extra: { name: 'BookmarkButtonError' } })
  }, [error])

  return (
    <button
      className="flex justify-center items-center gap-1 border-2 w-fit border-red-800 rounded-lg p-1 px-2 transition flex-1"
      onClick={reset}
    >
      <IconBookmark className="w-4 text-red-700" />
      <span className="text-red-700">오류</span>
    </button>
  )
}

export function BookmarkButtonSkeleton({ className = '' }: Readonly<BookmarkButtonSkeletonProps>) {
  return (
    <button
      className={`flex justify-center items-center gap-1 border-2 w-fit rounded-lg p-1 px-2 bg-zinc-900 transition ${className}`}
      disabled
    >
      <IconBookmark className="w-4" />
      <span>북마크</span>
    </button>
  )
}
