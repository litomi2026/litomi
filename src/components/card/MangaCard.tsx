import { ErrorBoundary, Suspense } from '@suspensive/react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { memo } from 'react'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'
import { SourceParam } from '@/utils/param'

import IconExternalLink from '../icons/IconExternalLink'
import TagList from '../TagList'
import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from './BookmarkButton'
import ImageDownloadButton from './ImageDownloadButton'
import MangaCardImage from './MangaCardImage'
import MangaMetadataItem from './MangaMetadataItem'
import MangaMetadataList from './MangaMetadataList'

type Props = {
  manga: Manga
  source: SourceParam
  index?: number
  className?: string
}

const PREFETCH_INDEX = 10

export default memo(MangaCard)

export function MangaCardSkeleton() {
  return <li className="animate-fade-in rounded-xl bg-zinc-900 border-2 aspect-[3/4] w-full h-full" />
}

function MangaCard({ manga, index = 0, source, className = '' }: Props) {
  const { id, artists, characters, date, group, series, tags, title, type } = manga
  const viewerLink = getViewerLink(id, source)

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
          <Link href={viewerLink} prefetch={index < PREFETCH_INDEX}>
            <h4 className="line-clamp-3 font-bold text-base leading-5 min-w-0 wrap-anywhere hover:underline">
              {title}
            </h4>
          </Link>
          {type && <MangaMetadataItem filterType="type" label="종류" value={type} />}
          {artists && artists.length > 0 && <MangaMetadataList filterType="artist" label="작가" values={artists} />}
          {group && group.length > 0 && <MangaMetadataList filterType="group" label="그룹" values={group} />}
          {series && series.length > 0 && <MangaMetadataList filterType="series" label="시리즈" values={series} />}
          {characters && characters.length > 0 && (
            <MangaMetadataList filterType="character" label="캐릭터" values={characters} />
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
          <div className="flex flex-wrap justify-around gap-2 text-sm [&_button]:disabled:bg-zinc-800 [&_button]:disabled:pointer-events-none [&_button]:disabled:text-zinc-500">
            <ImageDownloadButton
              className="grow"
              disabled={source === SourceParam.HIYOBI || source === SourceParam.K_HENTAI}
              manga={manga}
            />
            <ErrorBoundary fallback={BookmarkButtonError}>
              <Suspense clientOnly fallback={<BookmarkButtonSkeleton className="grow" />}>
                <BookmarkButton className="grow" manga={manga} source={source} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </li>
  )
}
