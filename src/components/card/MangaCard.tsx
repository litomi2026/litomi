import { ErrorBoundary } from '@suspensive/react'
import { ExternalLink } from 'lucide-react'
import { ReactNode, Suspense } from 'react'
import { twMerge } from 'tailwind-merge'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'
import { View } from '@/utils/param'

import BookmarkButton, { BookmarkButtonError } from './BookmarkButton'
import DownloadButton from './DownloadButton'
import MangaCardDate from './MangaCardDate'
import MangaCardImage from './MangaCardImage'
import MangaCardStats from './MangaCardStats'
import MangaIdLink from './MangaIdLink'
import MangaLanguageLink from './MangaLanguageLink'
import MangaMetadataLink from './MangaMetadataLink'
import MangaMetadataList from './MangaMetadataList'
import MangaMetadataListWithLink from './MangaMetadataListWithLink'
import MangaTagList from './MangaTagList'
import MangaTitle from './MangaTitle'
import SearchFromHereButton from './SearchFromHereButton'

type Props = {
  manga: Manga
  index?: number
  className?: string
  showSearchFromNextButton?: boolean
  variant?: View
}

type SkeletonProps = {
  children?: ReactNode
  className?: string
  variant?: View
}

const VARIANT_CONFIG = {
  [View.CARD]: {
    // NOTE: iOS Safari 이슈로 View.IMAGE 일 때 content-auto 비활성화
    containerClassName: 'flex flex-col content-auto',
    showBody: true,
  },
  [View.IMAGE]: {
    containerClassName: '',
    showBody: false,
  },
} as const

const SKELETON_VARIANT_CLASS_NAMES = {
  [View.CARD]: 'aspect-5/7',
  [View.IMAGE]: 'aspect-5/7',
} as const

export default function MangaCard({
  manga,
  index = 0,
  className = '',
  showSearchFromNextButton,
  variant = View.CARD,
}: Props) {
  const { id, artists, characters, date, group, series, images, tags, title, type, count, languages, uploader } = manga
  const viewerLink = getViewerLink(id)
  const config = VARIANT_CONFIG[variant]

  return (
    <li
      className={twMerge(
        'border-2 rounded-xl overflow-hidden bg-zinc-900 relative',
        config.containerClassName,
        className,
      )}
      data-manga-card
      key={id}
    >
      <MangaCardImage manga={manga} mangaIndex={index} variant={variant} />
      {config.showBody && (
        <div className="flex grow flex-col justify-between gap-2 p-2 border-t-2">
          <dl className="flex flex-col gap-2 text-sm [&_dt]:whitespace-nowrap [&_dt]:font-semibold">
            <div className="flex items-start gap-1.5">
              <a
                className="flex-1 hover:underline focus:underline visited:text-zinc-500"
                href={viewerLink}
                target="_blank"
              >
                <h4 className="line-clamp-3 font-bold text-base leading-5 min-w-0 wrap-break-word break-all">
                  <Suspense>
                    <MangaTitle title={title} />
                  </Suspense>
                  <ExternalLink className="size-3 ml-1 text-zinc-400 inline-block" />
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
              <Suspense>
                <MangaIdLink id={id} viewerLink={viewerLink} />
              </Suspense>
              {date && <MangaCardDate manga={manga} />}
            </div>
            <div
              className="flex flex-wrap justify-around gap-2 text-sm font-medium 
              [&_button]:transition [&_button]:bg-zinc-900 [&_button]:rounded-lg [&_button]:p-1 [&_button]:px-2 [&_button]:border-2 [&_button]:h-full [&_button]:w-full
              [&_button]:disabled:bg-zinc-800 [&_button]:disabled:cursor-not-allowed [&_button]:disabled:text-zinc-500 
              [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:active:border-zinc-700"
            >
              <ErrorBoundary fallback={BookmarkButtonError}>
                <BookmarkButton className="flex-1" manga={manga} />
              </ErrorBoundary>
              {showSearchFromNextButton ? (
                <Suspense>
                  <SearchFromHereButton className="flex-1" mangaId={id} />
                </Suspense>
              ) : images?.length === count ? (
                <DownloadButton className="flex-1" manga={manga} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </li>
  )
}

export function MangaCardSkeleton({ children, className = '', variant = View.CARD }: SkeletonProps) {
  return (
    <li
      className={twMerge(
        'animate-fade-in rounded-xl bg-zinc-900 border-2 w-full h-full flex flex-col justify-center items-center gap-1',
        SKELETON_VARIANT_CLASS_NAMES[variant],
        className,
      )}
    >
      {children}
    </li>
  )
}
