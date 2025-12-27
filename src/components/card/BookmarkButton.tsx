'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/get'
import type { POSTV1BookmarkToggleResponse } from '@/backend/api/v1/bookmark/toggle'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
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

  const toggleMutation = useMutation<{ createdAt: string | null }, unknown, number>({
    mutationFn: async (mangaId) => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mangaId }),
      })

      if (!response.ok) {
        const message = await response.text().catch(() => '')
        throw {
          status: response.status,
          error: message || '북마크 처리에 실패했어요',
        }
      }

      const successData = (await response.json()) as POSTV1BookmarkToggleResponse
      return { createdAt: successData.createdAt }
    },
    onSuccess: ({ createdAt }) => {
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
              type="button"
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
        if (!createdAt) {
          if (!oldBookmarks) {
            return oldBookmarks
          }

          return {
            bookmarks: oldBookmarks.bookmarks.filter((bookmark) => bookmark.mangaId !== mangaId),
            nextCursor: oldBookmarks.nextCursor,
          }
        }

        const newBookmark = { mangaId, createdAt: new Date(createdAt).getTime() }

        if (!oldBookmarks) {
          return {
            bookmarks: [newBookmark],
            nextCursor: null,
          }
        }

        return {
          bookmarks: [newBookmark, ...oldBookmarks.bookmarks.filter((bookmark) => bookmark.mangaId !== mangaId)],
          nextCursor: oldBookmarks.nextCursor,
        }
      })

      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarks })
    },
    onError: (error) => {
      const apiError = error as { status?: number; error?: string }

      if (typeof apiError.status === 'number' && typeof apiError.error === 'string') {
        if (apiError.status >= 400 && apiError.status < 500) {
          toast.warning(apiError.error)
        } else {
          toast.error(apiError.error)
        }

        if (apiError.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
        }
        return
      }

      if (error instanceof Error) {
        if (!navigator.onLine) {
          toast.error('네트워크 연결을 확인해 주세요')
        } else {
          toast.error('요청 처리 중 오류가 발생했어요')
        }
      }
    },
  })

  function handleToggleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!me) {
      const toastId = toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인이 필요해요</div>
          <LoginPageLink onClick={() => toast.dismiss(toastId)}>로그인하기</LoginPageLink>
        </div>,
      )
      return
    }
    if (toggleMutation.isPending) {
      return
    }

    toggleMutation.mutate(mangaId)
  }

  return (
    <div className="flex-1">
      <button
        className={twMerge(
          'flex justify-center items-center gap-1 transition disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-900 active:border-zinc-700',
          className,
        )}
        disabled={toggleMutation.isPending}
        onClick={handleToggleClick}
        type="button"
      >
        <Bookmark className="size-4" fill={isIconSelected ? 'currentColor' : 'none'} />
        <span>북마크</span>
      </button>
    </div>
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
