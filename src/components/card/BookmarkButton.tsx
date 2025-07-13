'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import toggleBookmark from '@/app/(navigation)/(right-search)/[loginId]/bookmark/action'
import { QueryKeys } from '@/constants/query'
import useActionErrorEffect from '@/hook/useActionErrorEffect'
import useBookmarksQuery from '@/query/useBookmarksQuery'
import useMeQuery from '@/query/useMeQuery'
import { Manga } from '@/types/manga'
import { mapSourceParamToBookmarkSource, SourceParam } from '@/utils/param'

import IconBookmark from '../icons/IconBookmark'
import LoginLink from '../LoginLink'

const initialState = {} as Awaited<ReturnType<typeof toggleBookmark>>

type BookmarkButtonSkeletonProps = {
  className?: string
}

type Props = {
  manga: Manga
  source: SourceParam
  className?: string
}

export default function BookmarkButton({ manga, source, className }: Readonly<Props>) {
  const { id: mangaId } = manga
  const { data: me } = useMeQuery()
  const { data: bookmarks } = useBookmarksQuery()
  const [{ error, success, isBookmarked, status }, formAction, isPending] = useActionState(toggleBookmark, initialState)
  const isIconSelected = bookmarks?.has(mangaId)
  const queryClient = useQueryClient()

  useActionErrorEffect({
    status,
    error,
    onError: (error) => {
      if (typeof error === 'string') {
        toast.error(error)
      } else {
        toast.error(error.mangaId?.[0] ?? error.source?.[0])
      }
    },
  })

  useEffect(() => {
    if (!success) {
      return
    }

    toast.success(isBookmarked ? '북마크를 추가했어요' : '북마크를 삭제했어요')

    queryClient.setQueryData<Set<number>>(QueryKeys.bookmarks, (oldBookmarks) => {
      if (!oldBookmarks) {
        return new Set([mangaId])
      } else if (isBookmarked) {
        oldBookmarks.add(mangaId)
      } else {
        oldBookmarks.delete(mangaId)
      }
      return new Set(oldBookmarks)
    })

    if (isBookmarked) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarks })
    }
  }, [success, isBookmarked, queryClient, mangaId])

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
      <input name="source" type="hidden" value={mapSourceParamToBookmarkSource(source)} />
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

export function BookmarkButtonError({ error, reset }: ErrorBoundaryFallbackProps) {
  useEffect(() => {
    captureException(error, { extra: { name: 'BookmarkButtonError' } })
  }, [error])

  return (
    <button
      className="flex justify-center items-center gap-1 border-2 w-fit border-red-800 rounded-lg p-1 px-2 transition grow"
      onClick={reset}
    >
      <IconBookmark className="w-4 text-red-700" />
      <span className="hidden md:block text-red-700">오류</span>
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
