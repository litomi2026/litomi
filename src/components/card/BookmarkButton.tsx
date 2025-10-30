'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'

import toggleBookmark from '@/app/(navigation)/library/bookmark/action'
import { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark'
import { QueryKeys } from '@/constants/query'
import useActionResponse from '@/hook/useActionResponse'
import useBookmarksQuery from '@/query/useBookmarksQuery'
import useMeQuery from '@/query/useMeQuery'
import { Manga } from '@/types/manga'

import IconBookmark from '../icons/IconBookmark'
import LoginPageLink from '../LoginPageLink'
import { useLibraryModal } from './LibraryModal'

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
  const bookmarkIds = useMemo(() => new Set(bookmarks?.bookmarks.map((bookmark) => bookmark.mangaId)), [bookmarks])
  const isIconSelected = bookmarkIds.has(mangaId)
  const queryClient = useQueryClient()
  const { open: openLibraryModal } = useLibraryModal()

  const [_, dispatchAction, isPending] = useActionResponse({
    action: toggleBookmark,
    onSuccess: ({ mangaId, createdAt }) => {
      const isBookmarked = Boolean(createdAt)

      if (isBookmarked) {
        toast.success(
          <div className="flex items-center justify-between gap-2 w-full">
            <span>북마크를 추가했어요</span>
            <button
              className="text-brand hover:underline text-sm font-bold"
              onClick={() => {
                toast.dismiss()
                openLibraryModal(mangaId)
              }}
            >
              [서재에도 추가하기]
            </button>
          </div>,
          { duration: 5000 },
        )
      } else {
        toast.success('북마크를 삭제했어요')
      }

      queryClient.setQueryData<GETV1BookmarkResponse>(QueryKeys.bookmarks, (oldBookmarks) => {
        const newBookmark = { mangaId, createdAt: createdAt ? new Date(createdAt).getTime() : 0 }

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
    },
    shouldSetResponse: false,
  })

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!me) {
      event.preventDefault()
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요</div>
          <LoginPageLink>로그인하기</LoginPageLink>
        </div>,
      )
    }
  }

  return (
    <form action={dispatchAction} className={className}>
      <input name="mangaId" type="hidden" value={mangaId} />
      <button
        className="flex justify-center items-center gap-1 w-full h-full transition disabled:bg-zinc-900"
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
