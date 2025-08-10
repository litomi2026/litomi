import { ErrorBoundary } from '@suspensive/react'
import dayjs from 'dayjs'
import { memo, Suspense, useState } from 'react'

import { Manga } from '@/types/manga'

import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from '../card/BookmarkButton'
import DownloadButton, { DownloadButtonError, DownloadButtonSkeleton } from '../card/DownloadButton'
import MangaMetadataItem from '../card/MangaMetadataItem'
import MangaMetadataList from '../card/MangaMetadataList'
import TagList from '../TagList'
import Modal from '../ui/Modal'

const MAX_DESCRIPTION_LENGTH = 150
const MAX_INITIAL_LINES = 1

type Props = {
  manga: Manga
}

export default memo(MangaDetailButton)

function MangaDetailButton({ manga }: Readonly<Props>) {
  const { title, artists, group, series, characters, type, tags, date, languages, origin, description, lines } = manga
  const [isOpened, setIsOpened] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAllLines, setShowAllLines] = useState(false)
  const isDownloadable = origin === 'https://soujpa.in'
  const shouldTruncateDescription = description && description.length > MAX_DESCRIPTION_LENGTH
  const hasMoreLines = lines && lines.length > MAX_INITIAL_LINES
  const displayLines = showAllLines ? lines : lines?.slice(0, MAX_INITIAL_LINES)

  const displayDescription =
    shouldTruncateDescription && !showFullDescription
      ? description.slice(0, MAX_DESCRIPTION_LENGTH) + '...'
      : description

  return (
    <>
      <button className="hover:underline" onClick={() => setIsOpened(true)} type="button">
        <h1 className="flex-1 text-center line-clamp-1 font-bold text-foreground break-all md:text-lg">{title}</h1>
      </button>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <div className="bg-zinc-900 min-w-3xs w-screen max-w-sm md:max-w-lg rounded-xl p-4 pt-8 shadow-xl border grid gap-4 text-sm overflow-y-auto max-h-svh md:text-base">
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
            {languages && languages.length > 0 && (
              <div className="flex gap-2">
                <strong>언어</strong>
                <MangaMetadataList details={languages} filterType="language" />
              </div>
            )}
            {type && (
              <div className="flex gap-2">
                <strong>종류</strong>
                <MangaMetadataItem filterType="type" value={type} />
              </div>
            )}
            {artists && artists.length > 0 && (
              <div className="flex gap-2">
                <strong>작가</strong>
                <MangaMetadataList details={artists} filterType="artist" />
              </div>
            )}
            {group && group.length > 0 && (
              <div className="flex gap-2">
                <strong>그룹</strong>
                <MangaMetadataList details={group} filterType="group" />
              </div>
            )}
            {series && series.length > 0 && (
              <div className="flex gap-2">
                <strong>시리즈</strong>
                <MangaMetadataList details={series} filterType="series" />
              </div>
            )}
            {characters && characters.length > 0 && (
              <div className="flex gap-2">
                <strong>캐릭터</strong>
                <MangaMetadataList details={characters} filterType="character" />
              </div>
            )}
            {date && (
              <div className="flex gap-2">
                <strong>날짜</strong>
                <span>{dayjs(date).format('YYYY-MM-DD HH:mm')}</span>
              </div>
            )}
            {tags && tags.length > 0 && (
              <TagList
                className="flex flex-wrap gap-1 font-medium [&_li]:rounded [&_li]:px-1 [&_li]:text-foreground"
                tags={tags}
              />
            )}
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
                    {showAllLines ? `접기` : `더보기 (+${lines.length - MAX_INITIAL_LINES})`}
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
            className="flex gap-2 text-sm pb-safe
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
