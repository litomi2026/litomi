'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useQueryClient } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import toggleBookmark from '@/app/(navigation)/library/bookmark/action'
import { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark'
import { QueryKeys } from '@/constants/query'
import useServerAction from '@/hook/useServerAction'
import useBookmarksQuery from '@/query/useBookmarksQuery'
import useMeQuery from '@/query/useMeQuery'

import LoginPageLink from '../LoginPageLink'
import { useLibraryModal } from './LibraryModal'

type Props = {
  manga: { id: number }
  className?: string
}

export default function BookmarkButton({ manga, className }: Props) {
  const { id: mangaId } = manga
  const { data: me } = useMeQuery()
  const { data: bookmarks } = useBookmarksQuery()
  const bookmarkIds = useMemo(() => new Set(bookmarks?.bookmarks.map((bookmark) => bookmark.mangaId)), [bookmarks])
  const isIconSelected = bookmarkIds.has(mangaId)
  const queryClient = useQueryClient()
  const { open: openLibraryModal } = useLibraryModal()

  const [_, dispatchAction, isPending] = useServerAction({
    action: toggleBookmark,
    onSuccess: ({ mangaId, createdAt }) => {
      const isBookmarked = Boolean(createdAt)

      if (isBookmarked) {
        toast.success(
          <div className="flex items-center justify-between gap-2 w-full">
            <span>북마크에 추가했어요</span>
            <button
              className="hover:underline text-sm font-bold"
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
        toast.info('작품을 북마크에서 삭제했어요')
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

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!me) {
      e.preventDefault()
      const toastId = toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요</div>
          <LoginPageLink onClick={() => toast.dismiss(toastId)}>로그인하기</LoginPageLink>
        </div>,
      )
    }
  }

  return (
    <form action={dispatchAction} className="flex-1">
      <input name="mangaId" type="hidden" value={mangaId} />
      <button
        className={twMerge(
          'flex justify-center items-center gap-1 transition disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-900 active:border-zinc-700',
          className,
        )}
        disabled={isPending}
        onClick={handleClick}
        type="submit"
      >
        <Bookmark className="size-4" fill={isIconSelected ? 'currentColor' : 'none'} />
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
      <Bookmark className="size-4 text-red-700" />
      <span className="text-red-700">오류</span>
    </button>
  )
}
