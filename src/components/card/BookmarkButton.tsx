'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Loader2 } from 'lucide-react'
import ms from 'ms'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { GETV1BookmarkIdResponse } from '@/backend/api/v1/bookmark/id'
import type { POSTV1BookmarkToggleResponse } from '@/backend/api/v1/bookmark/toggle'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useDelayedPendingIndicator from '@/hook/useDelayedPendingIndicator'
import { showAdultVerificationRequiredToast, showLoginRequiredToast } from '@/lib/toast'
import useBookmarkQuery from '@/query/useBookmarkQuery'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import { useLibraryModal } from './LibraryModal'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Props = {
  manga: { id: number }
  className?: string
}

export default function BookmarkButton({ manga, className }: Props) {
  const { id: mangaId } = manga
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)
  const { data: bookmarks } = useBookmarkQuery()
  const bookmarkIds = useMemo(() => new Set(bookmarks?.mangaIds), [bookmarks])
  const isIconSelected = bookmarkIds.has(mangaId)
  const queryClient = useQueryClient()
  const { open: openLibraryModal } = useLibraryModal()

  const toggleMutation = useMutation<{ createdAt: string | null }, unknown, number>({
    mutationFn: async (mangaId) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark/toggle`

      const { data } = await fetchWithErrorHandling<POSTV1BookmarkToggleResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mangaId }),
      })

      return { createdAt: data.createdAt }
    },
    onSuccess: ({ createdAt }) => {
      const isBookmarked = Boolean(createdAt)
      const toastId = `bookmark-toggle-${mangaId}`

      if (isBookmarked) {
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
        toast.success('북마크에서 삭제했어요', { id: toastId })
      }

      queryClient.setQueryData<GETV1BookmarkIdResponse>(QueryKeys.bookmarks, (oldBookmarks) => {
        if (!createdAt) {
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

      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarks })
    },
  })

  const isSpinnerVisible = useDelayedPendingIndicator(toggleMutation.isPending)

  function handleToggleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()

    if (!me) {
      showLoginRequiredToast()
      return
    }
    if (!hasAdultAccess(adultState)) {
      showAdultVerificationRequiredToast({ username: me.name })
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
        aria-busy={toggleMutation.isPending}
        className={twMerge(
          'flex justify-center items-center gap-1 transition disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-900 active:border-zinc-700',
          className,
        )}
        disabled={toggleMutation.isPending}
        onClick={handleToggleClick}
        type="button"
      >
        {isSpinnerVisible ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bookmark className="size-4" fill={isIconSelected ? 'currentColor' : 'none'} />
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
