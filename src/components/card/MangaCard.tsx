import { ErrorBoundary } from '@suspensive/react'
import { ExternalLink } from 'lucide-react'
import { memo, ReactNode, Suspense } from 'react'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'

import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from './BookmarkButton'
import DownloadButton from './DownloadButton'
import MangaCardDate from './MangaCardDate'
import MangaCardImage from './MangaCardImage'
import MangaCardStats from './MangaCardStats'
import MangaLanguageLink from './MangaLanguageLink'
import MangaMetadataLink from './MangaMetadataLink'
import MangaMetadataList from './MangaMetadataList'
import MangaMetadataListWithLink from './MangaMetadataListWithLink'
import MangaTagList from './MangaTagList'
import SearchFromHereButton from './SearchFromHereButton'

export { default as MangaCardDonation } from './MangaCardDonation'

type Props = {
  manga: Manga
  index?: number
  className?: string
  showSearchFromNextButton?: boolean
}

export default memo(MangaCard)

export function MangaCardSkeleton({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <li
      className={`animate-fade-in rounded-xl bg-zinc-900 border-2 aspect-[3/4] w-full h-full flex flex-col justify-center items-center gap-1 ${className}`}
    >
      {children}
    </li>
  )
}

function MangaCard({ manga, index = 0, className = '', showSearchFromNextButton }: Readonly<Props>) {
  const { id, artists, characters, date, group, series, images, tags, title, type, languages, uploader } = manga
  const isDownloadable = images?.[0]?.original?.url?.includes('soujpa.in')
  const viewerLink = getViewerLink(id)

  return (
    <li
      className={`flex flex-col border-2 rounded-xl overflow-hidden bg-zinc-900 relative content-auto ${className}`}
      data-manga-card
      key={id}
    >
      <MangaCardImage
        className="h-fit my-auto aspect-[4/3] [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-contain [&_img]:aspect-[4/3]"
        manga={manga}
        mangaIndex={index}
      />
      <div className="flex grow flex-col justify-between gap-2 p-2 border-t-2">
        <dl className="flex flex-col gap-2 text-sm [&_dt]:whitespace-nowrap [&_dt]:font-semibold">
          <div className="flex items-start gap-1.5">
            <a className="flex-1 hover:underline focus:underline" href={viewerLink} target="_blank">
              <h4 className="line-clamp-3 font-bold text-base leading-5 min-w-0 break-words break-all">
                {title} <ExternalLink className="size-3 ml-1 text-zinc-400 inline-block" />
              </h4>
            </a>
            {languages && languages.length > 0 && (
              <Suspense>
                <MangaLanguageLink key={languages[0].value} language={languages[0].value} />
              </Suspense>
            )}
          </div>
          {type && (
            <div className="flex gap-1">
              <dt>종류</dt>
              <Suspense>
                <MangaMetadataLink filterType="type" label={type.label} value={type.value} />
              </Suspense>
            </div>
          )}
          {artists && artists.length > 0 && (
            <div className="flex gap-1">
              <dt>작가</dt>
              <MangaMetadataListWithLink filterType="artist" items={artists} />
            </div>
          )}
          {group && group.length > 0 && (
            <div className="flex gap-1">
              <dt>그룹</dt>
              <MangaMetadataList filterType="group" labeledValues={group} />
            </div>
          )}
          {series && series.length > 0 && (
            <div className="flex gap-1">
              <dt>시리즈</dt>
              <MangaMetadataList filterType="series" labeledValues={series} />
            </div>
          )}
          {characters && characters.length > 0 && (
            <div className="flex gap-1">
              <dt>캐릭터</dt>
              <MangaMetadataListWithLink filterType="character" items={characters} />
            </div>
          )}
          {uploader && (
            <div className="flex gap-1">
              <dt>업로더</dt>
              <Suspense>
                <MangaMetadataLink filterType="uploader" value={uploader} />
              </Suspense>
            </div>
          )}
          {tags && tags.length > 0 && (
            <Suspense>
              <MangaTagList className="font-semibold" tags={tags} />
            </Suspense>
          )}
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
              <ExternalLink className="size-3" />
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
            {showSearchFromNextButton ? (
              <Suspense>
                <SearchFromHereButton className="flex-1" mangaId={id} />
              </Suspense>
            ) : isDownloadable ? (
              <DownloadButton className="flex-1" manga={manga} />
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
}
