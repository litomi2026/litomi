'use client'

import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

import { MangaIdSearchParam } from '@/app/manga/[id]/common'
import BackButton from '@/components/BackButton'
import MangaImage from '@/components/MangaImage'
import { type Manga } from '@/types/manga'

import type { ReaderPageRenderContext } from './ImageViewer/readerPages'

import FullscreenButton from './ImageViewer/FullscreenButton'
import ImageReader from './ImageViewer/ImageViewer'
import LastPage from './ImageViewer/LastPage'
import MangaDetailButton from './ImageViewer/MangaDetailButton'
import ReadingProgressSaver from './ImageViewer/ReadingProgress/ReadingProgressSaver'
import ResumeReadingToast from './ImageViewer/ReadingProgress/ResumeReadingToast'
import ShareButton from './ImageViewer/ShareButton'
import { getResponsivePictureSources } from './ImageViewer/util'
import { createMangaReaderPages, type MangaReaderPage } from './mangaReaderPages'

type Props = {
  manga: Manga
}

const TOP_BUTTON_CLASS_NAME =
  'rounded-full active:text-zinc-500 hover:bg-zinc-800 transition p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70'

export default function MangaImageViewer({ manga }: Props) {
  const pages = createMangaReaderPages(manga)

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

  return (
    <ImageReader
      header={
        <div className="flex gap-2 items-center justify-between p-3 select-none" role="toolbar">
          <div className="flex gap-1">
            <BackButton className={TOP_BUTTON_CLASS_NAME} fallbackUrl="/" />
            <FullscreenButton className={TOP_BUTTON_CLASS_NAME} />
          </div>
          <MangaDetailButton className={`${TOP_BUTTON_CLASS_NAME} hover:underline`} manga={manga} />
          <div className="flex gap-1">
            <Link
              aria-label="리뷰 보기"
              className={TOP_BUTTON_CLASS_NAME}
              href={`/manga/${manga.id}/detail`}
              prefetch={false}
              title="리뷰 보기"
            >
              <MessageCircle className="size-6" />
            </Link>
            <ShareButton className={TOP_BUTTON_CLASS_NAME} manga={manga} />
          </div>
        </div>
      }
      pages={pages}
      pageSearchParam={MangaIdSearchParam.PAGE}
      persistenceKey="litomi-reader"
      renderPage={renderPage}
      renderThumbnail={renderThumbnail}
    >
      {({ readerLayout }) => (
        <>
          <ResumeReadingToast
            manga={manga}
            maxPageIndex={Math.max(0, pages.length - 1)}
            pageIndexByReadablePageNumber={readerLayout.pageIndexByReadablePageNumber}
            readablePageCount={readerLayout.readablePageCount}
            readablePageNumberByPageIndex={readerLayout.readablePageNumberByPageIndex}
            scrollRowIndexByPageIndex={readerLayout.spreadIndexByPageIndex}
          />
          <ReadingProgressSaver
            mangaId={manga.id}
            readablePageCount={readerLayout.readablePageCount}
            readablePageNumberByPageIndex={readerLayout.readablePageNumberByPageIndex}
          />
        </>
      )}
    </ImageReader>
  )
}
