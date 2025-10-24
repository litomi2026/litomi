'use client'

import { ErrorBoundary } from '@suspensive/react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { ComponentProps, memo, Suspense, useState } from 'react'

import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from '@/components/card/BookmarkButton'
import DownloadButton, { DownloadButtonError, DownloadButtonSkeleton } from '@/components/card/DownloadButton'
import MangaCardStats from '@/components/card/MangaCardStats'
import MangaMetadataLabel from '@/components/card/MangaMetadataLabel'
import MangaMetadataLink from '@/components/card/MangaMetadataLink'
import MangaMetadataList from '@/components/card/MangaMetadataList'
import MangaTagList from '@/components/card/MangaTagList'
import Modal from '@/components/ui/Modal'
import { MANGA_INITIAL_LINES, MAX_MANGA_DESCRIPTION_LENGTH } from '@/constants/policy'
import { Manga } from '@/types/manga'

interface Props extends ComponentProps<'button'> {
  manga: Manga
}

export default memo(MangaDetailButton)

function MangaDetailButton({ manga, ...props }: Props) {
  const {
    id,
    title,
    artists,
    group,
    series,
    characters,
    type,
    tags,
    date,
    languages,
    images,
    description,
    lines,
    uploader,
  } = manga

  const [isOpened, setIsOpened] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAllLines, setShowAllLines] = useState(false)
  const isDownloadable = images?.[0]?.original?.url?.includes('soujpa.in')
  const shouldTruncateDescription = description && description.length > MAX_MANGA_DESCRIPTION_LENGTH
  const hasMoreLines = lines && lines.length > MANGA_INITIAL_LINES
  const displayLines = showAllLines ? lines : lines?.slice(0, MANGA_INITIAL_LINES)

  const displayDescription =
    shouldTruncateDescription && !showFullDescription
      ? description.slice(0, MAX_MANGA_DESCRIPTION_LENGTH) + '...'
      : description

  return (
    <>
      <button onClick={() => setIsOpened(true)} type="button" {...props}>
        <h1 className="flex-1 text-center line-clamp-1 font-bold text-foreground break-all md:text-lg">{title}</h1>
      </button>
      <Modal className="pb-safe" onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <div className="bg-zinc-900 min-w-3xs w-screen max-w-prose rounded-xl p-4 pt-8 shadow-xl border grid gap-4 text-sm overflow-y-auto max-h-svh md:text-base">
          {/* Title */}
          <h2 className="font-bold text-lg md:text-xl">{title}</h2>
          {/* Description - Primary Information */}
          {description && (
            <div className="bg-zinc-800/30 rounded-lg p-3">
              <p className="text-zinc-300 leading-relaxed">
                {displayDescription}
                {shouldTruncateDescription && (
                  <button
                    className="ml-1 text-brand-end font-medium hover:underline transition text-sm"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    type="button"
                  >
                    {showFullDescription ? '간략히' : '더보기'}
                  </button>
                )}
              </p>
            </div>
          )}
          {/* Core Metadata - Secondary Information */}
          <div className="grid gap-2 [&_strong]:whitespace-nowrap">
            <div className="flex gap-2">
              <strong>품번</strong>
              <Suspense>
                <MangaMetadataLink filterType="id" value={id.toString()} />
              </Suspense>
            </div>
            {languages && languages.length > 0 && (
              <div className="flex gap-2">
                <strong>언어</strong>
                <MangaMetadataList filterType="language" labeledValues={languages} />
              </div>
            )}
            {type && (
              <div className="flex gap-2">
                <strong>종류</strong>
                <Suspense>
                  <MangaMetadataLink filterType="type" label={type.label} value={type.value} />
                </Suspense>
              </div>
            )}
            {artists && artists.length > 0 && (
              <div className="flex gap-2">
                <strong>작가</strong>
                <MangaMetadataList filterType="artist" labeledValues={artists} />
              </div>
            )}
            {group && group.length > 0 && (
              <div className="flex gap-2">
                <strong>그룹</strong>
                <MangaMetadataList filterType="group" labeledValues={group} />
              </div>
            )}
            {series && series.length > 0 && (
              <div className="flex gap-2">
                <strong>시리즈</strong>
                <MangaMetadataList filterType="series" labeledValues={series} />
              </div>
            )}
            {characters && characters.length > 0 && (
              <div className="flex gap-2">
                <strong>캐릭터</strong>
                <MangaMetadataList filterType="character" labeledValues={characters} />
              </div>
            )}
            {uploader && (
              <div className="flex gap-2">
                <strong>업로더</strong>
                <Suspense>
                  <MangaMetadataLink filterType="uploader" value={uploader} />
                </Suspense>
              </div>
            )}
            {date && (
              <div className="flex gap-2">
                <strong>날짜</strong>
                <Link
                  className="hover:underline focus:underline"
                  href={`/search?to=${Math.ceil(new Date(date).getTime() / 1000) + 60}`}
                >
                  <MangaMetadataLabel>{dayjs(date).format('YYYY-MM-DD HH:mm')}</MangaMetadataLabel>
                </Link>
              </div>
            )}
            {tags && tags.length > 0 && (
              <Suspense>
                <MangaTagList className="font-medium" tags={tags} />
              </Suspense>
            )}
            <MangaCardStats manga={manga} />
          </div>
          {/* Lines/Dialogue Preview - Quaternary Information */}
          {lines && lines.length > 0 && (
            <div className="border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-zinc-400 text-sm font-medium">대사 미리보기</span>
                {hasMoreLines && (
                  <button
                    className="text-brand-end font-medium group-hover:underline transition text-xs"
                    onClick={() => setShowAllLines(!showAllLines)}
                    type="button"
                  >
                    {showAllLines ? `접기` : `더보기 (+${lines.length - MANGA_INITIAL_LINES})`}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {displayLines?.map((line, index) => (
                  <div className="flex gap-2 text-zinc-300 text-sm" key={index}>
                    <span className="text-zinc-600 text-lg select-none">&ldquo;</span>
                    <span className="italic flex-1">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            className="flex gap-2 text-sm
            [&_button]:transition [&_button]:bg-zinc-900 [&_button]:rounded-lg [&_button]:p-1 [&_button]:px-2 [&_button]:border-2 [&_button]:h-full [&_button]:w-full
            [&_button]:disabled:bg-zinc-800 [&_button]:disabled:pointer-events-none [&_button]:disabled:text-zinc-500 [&_button]:disabled:cursor-not-allowed 
            [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:active:border-zinc-700"
          >
            <ErrorBoundary fallback={BookmarkButtonError}>
              <Suspense fallback={<BookmarkButtonSkeleton className="flex-1" />}>
                <BookmarkButton className="flex-1" manga={manga} />
              </Suspense>
            </ErrorBoundary>
            {isDownloadable && (
              <ErrorBoundary fallback={DownloadButtonError}>
                <Suspense fallback={<DownloadButtonSkeleton className="flex-1" />}>
                  <DownloadButton className="flex-1" manga={manga} />
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
