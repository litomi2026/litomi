'use client'

import type { POSTV1MangaIdHistoryBody } from '@litomi/contracts'

import { type Manga } from '@litomi/domain/manga/model'
import { env } from '@litomi/env/client'
import Reader, {
  type ReaderNotice,
  type ReaderPageRenderContext,
  type ReadingProgress,
  type ReadingProgressSaveOptions,
} from '@litomi/image-reader'
import { useQueryClient } from '@tanstack/react-query'
import { Hash, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { MangaIdSearchParam } from '@/app/manga/[id]/common'
import BackButton from '@/components/BackButton'
import MangaImage from '@/components/MangaImage'
import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { fetchAPIData } from '@/utils/api-request'
import { getLocaleFromCookie } from '@/utils/locale-from-cookie'
import { setLocalReadingHistoryEntry } from '@/utils/reading-history-index'

import FullscreenButton from './FullscreenButton'
import LastPage from './LastPage'
import MangaDetailButton from './MangaDetailButton'
import MangaIdJumpForm from './MangaIdJumpForm'
import { createMangaReaderPages, type MangaReaderPage } from './mangaReaderPages'
import ShareButton from './ShareButton'
import useMangaReadingHistory from './useMangaReadingHistory'
import { getResponsivePictureSources } from './util'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Props = {
  manga: Manga
}

const TOP_BUTTON_CLASS_NAME =
  'rounded-full active:text-zinc-500 hover:bg-zinc-800 transition p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70'

export default function MangaReader({ manga }: Props) {
  const [isMangaIdJumpOpen, setIsMangaIdJumpOpen] = useState(false)
  const { lastPage } = useMangaReadingHistory(manga.id)
  const { data: me } = useMeQuery()
  const queryClient = useQueryClient()

  const pages = createMangaReaderPages(manga)
  const locale = getLocaleFromCookie() || 'ko'
  const adultState = getAdultState(me)
  const canSyncReadingProgress = hasAdultAccess(adultState) && me?.settings.historySyncEnabled === true

  function handleReaderNotice(notice: ReaderNotice) {
    const toastOptions = {
      action: notice.action,
      duration: notice.durationMs,
      id: notice.id,
    }

    const toastId =
      notice.severity === 'warning'
        ? toast.warning(notice.message, toastOptions)
        : toast.info(notice.message, toastOptions)

    return {
      dismiss: () => toast.dismiss(toastId),
    }
  }

  function handleReadingProgressChange(progress: ReadingProgress) {
    setLocalReadingHistoryEntry(manga.id, progress.readablePageNumber)
    queryClient.invalidateQueries({ queryKey: QueryKeys.localReadingHistorySummary })
    queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteReadingHistory('local') })
  }

  async function handleReadingProgressSave(progress: ReadingProgress, options?: ReadingProgressSaveOptions) {
    const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/manga/${manga.id}/history`

    const body: POSTV1MangaIdHistoryBody = {
      lastPage: progress.readablePageNumber,
    }

    await fetchAPIData<void>(url, {
      method: 'POST',
      credentials: 'include',
      keepalive: options?.keepalive,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  function renderPage({ fetchPriority, page }: ReaderPageRenderContext<MangaReaderPage>) {
    if (page.kind === 'last') {
      return <LastPage manga={manga} />
    }

    return (
      <MangaImage
        alt={`${manga.title} ${page.imageIndex + 1}페이지`}
        fetchPriority={fetchPriority}
        imageIndex={page.imageIndex}
        mangaId={manga.id}
        pictures={getResponsivePictureSources(page.image)}
        src={page.thumbnail?.url}
        variant="thumbnail"
      />
    )
  }

  function renderThumbnail({ fetchPriority, page, pageIndex }: ReaderPageRenderContext<MangaReaderPage>) {
    if (page.kind === 'last') {
      return
    }

    return (
      <MangaImage
        alt={`${pageIndex + 1}페이지 미리보기`}
        className="h-full w-full object-cover"
        fetchPriority={fetchPriority}
        imageIndex={page.imageIndex}
        mangaId={manga.id}
        src={page.thumbnail?.url}
        variant="thumbnail"
      />
    )
  }

  // NOTE: 뷰어 들어오면 최신 감상 기록으로 갱신해요.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistory(manga.id) })
  }, [manga.id, queryClient])

  return (
    <Reader
      header={
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-y-2 items-center p-2 select-none" role="toolbar">
          <div className="flex">
            <BackButton className={TOP_BUTTON_CLASS_NAME} fallbackUrl="/" />
            <FullscreenButton className={TOP_BUTTON_CLASS_NAME} />
          </div>
          <MangaDetailButton className={`${TOP_BUTTON_CLASS_NAME} min-w-0 hover:underline`} manga={manga} />
          <div className="flex items-center">
            <MangaIdJumpForm className="hidden w-30 md:flex" currentMangaId={manga.id} />
            <button
              aria-controls="mobile-manga-id-jump"
              aria-expanded={isMangaIdJumpOpen}
              className={`${TOP_BUTTON_CLASS_NAME} md:hidden`}
              onClick={() => setIsMangaIdJumpOpen((prev) => !prev)}
              title="작품 번호로 이동"
              type="button"
            >
              <Hash className="size-6" />
            </button>
            <Link
              className={twMerge('flex items-center gap-2', TOP_BUTTON_CLASS_NAME)}
              href={`/manga/${manga.id}/detail`}
              prefetch={false}
              title="작품 상세"
            >
              <MessageCircle className="size-6" />
              <span className="text-sm font-semibold hidden lg:inline">작품 상세</span>
            </Link>
            <ShareButton className={TOP_BUTTON_CLASS_NAME} manga={manga} />
          </div>
          {isMangaIdJumpOpen && (
            <MangaIdJumpForm
              autoFocus
              className="col-span-3 flex md:hidden"
              currentMangaId={manga.id}
              formId="mobile-manga-id-jump"
              onNavigate={() => setIsMangaIdJumpOpen(false)}
            />
          )}
        </div>
      }
      locale={locale}
      onNotice={handleReaderNotice}
      pages={pages}
      pageSearchParam={MangaIdSearchParam.PAGE}
      persistenceKey="litomi-reader"
      readingProgress={{
        lastReadablePageNumber: lastPage,
        onChange: handleReadingProgressChange,
        onSave: canSyncReadingProgress ? handleReadingProgressSave : undefined,
      }}
      renderPage={renderPage}
      renderThumbnail={renderThumbnail}
    />
  )
}
