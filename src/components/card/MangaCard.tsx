import { ErrorBoundary } from '@suspensive/react'
import Link from 'next/link'
import { memo, Suspense } from 'react'

import { CensorshipLevel } from '@/database/enum'
import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'

import IconExternalLink from '../icons/IconExternalLink'
import LinkLoading from '../LinkLoading'
import TagList from '../TagList'
import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from './BookmarkButton'
import LanguageBadge from './LanguageBadge'
import MangaCardCensorship from './MangaCardCensorship'
import MangaCardDate from './MangaCardDate'
import MangaCardImage from './MangaCardImage'
import MangaCardStats from './MangaCardStats'
import MangaMetadataItem from './MangaMetadataItem'
import MangaMetadataList from './MangaMetadataList'
import SearchFromHereButton from './SearchFromHereButton'

type Props = {
  manga: Manga
  index?: number
  className?: string
  showSearchFromNextButton?: boolean
}

export default memo(MangaCard)

export function MangaCardSkeleton() {
  return <li className="animate-fade-in rounded-xl bg-zinc-900 border-2 aspect-[3/4] w-full h-full" />
}

function MangaCard({ manga, index = 0, className = '', showSearchFromNextButton }: Readonly<Props>) {
  const { id, artists, characters, date, group, series, tags, title, type, languages } = manga
  const viewerLink = getViewerLink(id)

  return (
    <li className={`flex flex-col border-2 rounded-xl overflow-hidden bg-zinc-900 relative ${className}`} key={id}>
      <MangaCardImage
        className="h-fit my-auto aspect-[4/3] [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-contain [&_img]:aspect-[4/3]"
        href={viewerLink}
        manga={manga}
        mangaIndex={index}
      />
      <div className="flex grow flex-col justify-between gap-2 p-2 border-t-2">
        <dl className="flex flex-col gap-2 text-sm [&_dt]:whitespace-nowrap [&_dt]:font-semibold">
          <div className="flex items-start gap-1.5">
            <Link className="flex-1 hover:underline focus:underline" href={viewerLink} target="_blank">
              <LinkLoading />
              <h4 className="line-clamp-3 font-bold text-base leading-5 min-w-0 break-words break-all">{title}</h4>
            </Link>
            {languages && languages.length > 0 && (
              <LanguageBadge key={languages[0].value} language={languages[0].value} />
            )}
          </div>
          {type && (
            <div className="flex gap-1">
              <dt>종류</dt>
              <MangaMetadataItem filterType="type" value={type} />
            </div>
          )}
          {artists && artists.length > 0 && (
            <div className="flex gap-1">
              <dt>작가</dt>
              <MangaMetadataList details={artists} filterType="artist" />
            </div>
          )}
          {group && group.length > 0 && (
            <div className="flex gap-1">
              <dt>그룹</dt>
              <MangaMetadataList details={group} filterType="group" />
            </div>
          )}
          {series && series.length > 0 && (
            <div className="flex gap-1">
              <dt>시리즈</dt>
              <MangaMetadataList details={series} filterType="series" />
            </div>
          )}
          {characters && characters.length > 0 && (
            <div className="flex gap-1">
              <dt>캐릭터</dt>
              <MangaMetadataList details={characters} filterType="character" />
            </div>
          )}
          {tags && tags.length > 0 && <TagList className="flex flex-wrap gap-1 font-semibold" tags={tags} />}
        </dl>
        <div className="grid gap-2">
          <MangaCardStats manga={manga} />
          <div className="flex text-xs justify-between items-center gap-1">
            <a
              className="text-zinc-400 focus:underline flex items-center gap-1 hover:underline"
              href={viewerLink}
              target="_blank"
            >
              {id}
              <IconExternalLink className="w-3" />
            </a>
            {date && <MangaCardDate manga={manga} />}
          </div>
          <div
            className="flex flex-wrap justify-around gap-2 text-sm font-medium 
            [&_button]:transition [&_button]:bg-zinc-900 [&_button]:rounded-lg [&_button]:p-1 [&_button]:px-2 [&_button]:border-2 [&_button]:h-full [&_button]:w-full
            [&_button]:disabled:bg-zinc-800 [&_button]:disabled:cursor-not-allowed [&_button]:disabled:text-zinc-500 
            [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:active:border-zinc-700"
          >
            <ErrorBoundary fallback={BookmarkButtonError}>
              <Suspense fallback={<BookmarkButtonSkeleton className="flex-1" />}>
                <BookmarkButton className="flex-1" manga={manga} />
              </Suspense>
            </ErrorBoundary>
            {showSearchFromNextButton && (
              <Suspense>
                <SearchFromHereButton className="flex-1" mangaId={id} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
      <MangaCardCensorship level={CensorshipLevel.HEAVY} manga={manga} />
    </li>
  )
}
