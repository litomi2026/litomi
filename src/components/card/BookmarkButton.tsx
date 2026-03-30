'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Loader2 } from 'lucide-react'
import ms from 'ms'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { PUTV1BookmarkIdResponse } from '@/backend/api/v1/bookmark/[id]/PUT'
import type { GETV1BookmarkIdResponse } from '@/backend/api/v1/bookmark/id'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useDelayedPendingIndicator from '@/hook/useDelayedPendingIndicator'
import { showLoginRequiredToast } from '@/lib/toast'
import useBookmarkQuery from '@/query/useBookmarkQuery'
import useMeQuery from '@/query/useMeQuery'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import { useLibraryModal } from './LibraryModal'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Props = {
  manga: { id: number }
  className?: string
}

export default function BookmarkButton({ manga, className }: Props) {
  const { id: mangaId } = manga
  const { data: me } = useMeQuery()
  const { data: bookmarks } = useBookmarkQuery()
  const bookmarkIds = useMemo(() => new Set(bookmarks?.mangaIds), [bookmarks])
  const isBookmarked = bookmarkIds.has(mangaId)
  const queryClient = useQueryClient()
  const { open: openLibraryModal } = useLibraryModal()

  const saveMutation = useMutation<void, unknown, { mangaId: number; shouldBookmark: boolean }>({
    mutationFn: async ({ mangaId, shouldBookmark }) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/bookmark/${mangaId}`

      if (!shouldBookmark) {
        await fetchWithErrorHandling(url, {
          method: 'DELETE',
          credentials: 'include',
        })
        return
      }

      await fetchWithErrorHandling<PUTV1BookmarkIdResponse>(url, {
        method: 'PUT',
        credentials: 'include',
      })
    },
    onSuccess: (_, { mangaId, shouldBookmark }) => {
      const toastId = `bookmark-toggle-${mangaId}`

      if (shouldBookmark) {
        toast.success('북마크에 추가했어요', {
          action: {
            label: '서재에도 추가',
            onClick: () => {
              toast.dismiss(toastId)
              openLibraryModal(mangaId)
            },
          },
          duration: ms('5 seconds'),
          id: toastId,
        })
      } else {
        toast.success('북마크에서 삭제했어요', { action: null, id: toastId })
      }

      queryClient.setQueryData<GETV1BookmarkIdResponse>(QueryKeys.bookmarks, (oldBookmarks) => {
        if (!shouldBookmark) {
          if (!oldBookmarks) {
            return oldBookmarks
          }

          return {
            mangaIds: oldBookmarks.mangaIds.filter((bookmarkId) => bookmarkId !== mangaId),
          }
        }

        if (!oldBookmarks) {
          return {
            mangaIds: [mangaId],
          }
        }

        return {
          mangaIds: [mangaId, ...oldBookmarks.mangaIds.filter((bookmarkId) => bookmarkId !== mangaId)],
        }
      })

      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarksBase })
    },
  })

  const isSpinnerVisible = useDelayedPendingIndicator(saveMutation.isPending)

  function handleToggleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!me) {
      showLoginRequiredToast()
      return
    }
    if (saveMutation.isPending) {
      return
    }

    saveMutation.mutate({ mangaId, shouldBookmark: !isBookmarked })
  }

  return (
    <div className="flex-1">
      <button
        aria-busy={saveMutation.isPending}
        className={twMerge(
          'flex justify-center items-center gap-1 transition disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-900 active:border-zinc-700',
          className,
        )}
        disabled={saveMutation.isPending}
        onClick={handleToggleClick}
        type="button"
      >
        {isSpinnerVisible ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
        )}
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
