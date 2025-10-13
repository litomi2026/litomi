import { ErrorBoundary } from '@suspensive/react'
import { ExternalLink, Heart } from 'lucide-react'
import { memo, ReactNode, Suspense } from 'react'

import { Manga } from '@/types/manga'
import { getViewerLink } from '@/utils/manga'

import LogoDiscord from '../icons/LogoDiscord'
import LogoGitHub from '../icons/LogoGitHub'
import LogoX from '../icons/LogoX'
import TagList from '../TagList'
import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from './BookmarkButton'
import DownloadButton from './DownloadButton'
import LanguageBadge from './LanguageBadge'
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

export function MangaCardDonation() {
  return (
    <MangaCardSkeleton className="overflow-hidden">
      <div className="h-full w-full overflow-y-auto flex scrollbar-hidden">
        <div className="m-auto flex flex-col items-center gap-6 p-6 text-center max-w-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-zinc-800/50">
              <Heart className="size-6 fill-current text-brand-end" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-100">리토미를 도와주세요</h3>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            매일 몇천 원의 서버 비용이 발생하는데 유해 광고 없이 서비스를 운영하기 위해 여러분의 도움이 필요해요.
          </p>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">소셜</span>
              <div className="flex flex-col gap-2">
                <a
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-sm font-medium"
                  href="https://x.com/litomi_in"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <LogoX className="size-4" />
                  <span>@litomi_in 팔로우</span>
                </a>
                <a
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-sm font-medium"
                  href="https://github.com/gwak2837/litomi"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <LogoGitHub className="size-4" />
                  <span>GitHub Star</span>
                </a>
                <a
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-sm font-medium"
                  href="https://discord.gg/xTrbQaxpyD"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <LogoDiscord className="size-4" />
                  <span>Discord 채널 부스트</span>
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">후원</span>
              <div className="grid grid-cols-2 gap-2">
                <a
                  className="py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-sm font-medium text-center"
                  href="https://patreon.com/litomi"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Patreon
                </a>
                <a
                  className="py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-sm font-medium text-center"
                  href="https://ko-fi.com/litomi"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Ko-fi
                </a>
                <a
                  className="col-span-2 py-2 px-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-sm font-medium text-center"
                  href="https://velog.io/@gwak2837/%EC%A0%9C%EC%A3%BC-%EC%82%BC%EB%8B%A4%EC%88%98"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  쿠팡 파트너스
                </a>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500">참여해주셔서 감사합니다 🙇</p>
        </div>
      </div>
    </MangaCardSkeleton>
  )
}

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
  const { id, artists, characters, date, group, series, tags, title, type, origin, languages, uploader } = manga
  const isDownloadable = origin === 'https://soujpa.in'
  const viewerLink = getViewerLink(id)

  return (
    <li
      className={`flex flex-col border-2 rounded-xl overflow-hidden bg-zinc-900 relative ${className}`}
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
                <LanguageBadge key={languages[0].value} language={languages[0].value} />
              </Suspense>
            )}
          </div>
          {type && (
            <div className="flex gap-1">
              <dt>종류</dt>
              <Suspense>
                <MangaMetadataItem filterType="type" value={type} />
              </Suspense>
            </div>
          )}
          {artists && artists.length > 0 && (
            <div className="flex gap-1">
              <dt>작가</dt>
              <Suspense>
                <MangaMetadataList details={artists} filterType="artist" />
              </Suspense>
            </div>
          )}
          {group && group.length > 0 && (
            <div className="flex gap-1">
              <dt>그룹</dt>
              <Suspense>
                <MangaMetadataList details={group} filterType="group" />
              </Suspense>
            </div>
          )}
          {series && series.length > 0 && (
            <div className="flex gap-1">
              <dt>시리즈</dt>
              <Suspense>
                <MangaMetadataList details={series} filterType="series" />
              </Suspense>
            </div>
          )}
          {characters && characters.length > 0 && (
            <div className="flex gap-1">
              <dt>캐릭터</dt>
              <Suspense>
                <MangaMetadataList details={characters} filterType="character" />
              </Suspense>
            </div>
          )}
          {uploader && (
            <div className="flex gap-1">
              <dt>업로더</dt>
              <Suspense>
                <MangaMetadataItem filterType="uploader" value={uploader} />
              </Suspense>
            </div>
          )}
          {tags && tags.length > 0 && (
            <Suspense>
              <TagList className="flex flex-wrap gap-1 font-semibold" tags={tags} />
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
