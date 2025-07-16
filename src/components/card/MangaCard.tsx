import { ErrorBoundary } from '@suspensive/react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { memo, Suspense } from 'react'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'
import { SourceParam } from '@/utils/param'

import IconExternalLink from '../icons/IconExternalLink'
import TagList from '../TagList'
import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from './BookmarkButton'
import DownloadButton, { DownloadButtonError, DownloadButtonSkeleton } from './DownloadButton'
import LanguageBadge from './LanguageBadge'
import MangaCardImage from './MangaCardImage'
import MangaMetadataItem from './MangaMetadataItem'
import MangaMetadataList from './MangaMetadataList'
import SearchFromHereButton from './SearchFromHereButton'

type Props = {
  manga: Manga
  source: SourceParam
  index?: number
  className?: string
  showSearchFromNextButton?: boolean
}

const PREFETCH_INDEX = 10

export default memo(MangaCard)

export function MangaCardSkeleton() {
  return <li className="animate-fade-in rounded-xl bg-zinc-900 border-2 aspect-[3/4] w-full h-full" />
}

function MangaCard({ manga, index = 0, source, className = '', showSearchFromNextButton }: Readonly<Props>) {
  const { id, artists, characters, date, group, series, tags, title, type, language, images } = manga
  const viewerLink = getViewerLink(id, source)
  const isAllDownloadable = images.every((image) => image.startsWith('https://soujpa.in/')) // TODO: 다운로드 가능 여부 확인

  return (
    <li className={`grid grid-rows-[auto_1fr] border-2 rounded-xl overflow-hidden bg-zinc-900 ${className}`} key={id}>
      <MangaCardImage
        className="relative h-fit my-auto aspect-[4/3] [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-contain [&_img]:aspect-[4/3]"
        href={viewerLink}
        index={index}
        manga={manga}
      />
      <div className="flex grow flex-col justify-between gap-2 p-2 border-t-2 sm:border-t-0 sm:border-l-2 md:border-l-0 md:border-t-2">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-start gap-1.5">
            <Link
              className="flex-1 hover:underline focus:underline"
              href={viewerLink}
              prefetch={index < PREFETCH_INDEX}
            >
              <h4 className="line-clamp-3 font-bold text-base leading-5 min-w-0 break-words break-all">{title}</h4>
            </Link>
            {language && <LanguageBadge language={language} />}
          </div>
          {type && <MangaMetadataItem filterType="type" label="종류" value={type} />}
          {artists && artists.length > 0 && <MangaMetadataList details={artists} filterType="artist" term="작가" />}
          {group && group.length > 0 && <MangaMetadataList details={group} filterType="group" term="그룹" />}
          {series && series.length > 0 && <MangaMetadataList details={series} filterType="series" term="시리즈" />}
          {characters && characters.length > 0 && (
            <MangaMetadataList details={characters} filterType="character" term="캐릭터" />
          )}
          {tags && tags.length > 0 && (
            <div className="flex gap-2">
              <span className="whitespace-nowrap">태그</span>
              <TagList className="flex flex-wrap gap-1 font-semibold" clickable tags={tags} />
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex text-xs justify-between items-center gap-1">
            <a
              className="text-zinc-400 focus:underline flex items-center gap-1 hover:underline"
              href={viewerLink}
              target="_blank"
            >
              {id}
              <IconExternalLink className="w-3" />
            </a>
            {date && <div className="text-right text-zinc-400">{dayjs(date).format('YYYY-MM-DD HH:mm')}</div>}
          </div>
          <div
            className="flex flex-wrap justify-around gap-2 text-sm font-medium 
            [&_button]:transition [&_button]:bg-zinc-900 [&_button]:rounded-lg [&_button]:p-1 [&_button]:px-2 [&_button]:border-2 [&_button]:h-full [&_button]:w-full
            [&_button]:disabled:bg-zinc-800 [&_button]:disabled:cursor-not-allowed [&_button]:disabled:text-zinc-500 
            [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:active:border-zinc-700"
          >
            <ErrorBoundary fallback={BookmarkButtonError}>
              <Suspense fallback={<BookmarkButtonSkeleton className="flex-1" />}>
                <BookmarkButton className="flex-1" manga={manga} source={source} />
              </Suspense>
            </ErrorBoundary>
            {showSearchFromNextButton ? (
              <Suspense>
                <SearchFromHereButton className="flex-1" mangaId={id} />
              </Suspense>
            ) : isAllDownloadable ? (
              <ErrorBoundary fallback={DownloadButtonError}>
                <Suspense fallback={<DownloadButtonSkeleton className="flex-1" />}>
                  <DownloadButton className="flex-1" manga={manga} />
                </Suspense>
              </ErrorBoundary>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}
