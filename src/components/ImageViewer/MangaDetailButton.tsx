import { ErrorBoundary } from '@suspensive/react'
import dayjs from 'dayjs'
import { memo, Suspense, useState } from 'react'

import { Manga } from '@/types/manga'
import { SourceParam } from '@/utils/param'

import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from '../card/BookmarkButton'
import MangaMetadataItem from '../card/MangaMetadataItem'
import MangaMetadataList from '../card/MangaMetadataList'
import TagList from '../TagList'
import Modal from '../ui/Modal'

type Props = {
  manga: Manga
  source: SourceParam
}

export default memo(MangaDetailButton)

function MangaDetailButton({ manga, source }: Readonly<Props>) {
  const { title, artists, group, series, characters, type, tags, date, language } = manga
  const [isOpened, setIsOpened] = useState(false)

  return (
    <>
      <button className="hover:underline" onClick={() => setIsOpened(true)} type="button">
        <h1 className="flex-1 text-center line-clamp-1 font-bold text-foreground md:text-lg">{title}</h1>
      </button>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <div className="bg-zinc-900 min-w-3xs w-screen max-w-sm md:max-w-lg rounded-xl p-4 pt-8 shadow-xl border grid gap-3 text-sm overflow-auto max-h-svh md:text-base">
          <h2 className="font-bold text-lg md:text-xl">{title}</h2>
          <div className="grid gap-2 [&_strong]:whitespace-nowrap">
            {language && (
              <div className="flex gap-2">
                <strong>언어</strong>
                <MangaMetadataItem filterType="language" value={language} />
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
          <div
            className="flex flex-wrap justify-around gap-2 text-sm [&_button]:transition [&_button]:bg-zinc-900 [&_button]:rounded-lg [&_button]:p-1 [&_button]:px-2 [&_button]:border-2 [&_button]:h-full [&_button]:w-full
            [&_button]:disabled:bg-zinc-800 [&_button]:disabled:pointer-events-none [&_button]:disabled:text-zinc-500 [&_button]:disabled:cursor-not-allowed 
            [&_button]:hover:bg-zinc-800 [&_button]:active:bg-zinc-900 [&_button]:active:border-zinc-700"
          >
            <ErrorBoundary fallback={BookmarkButtonError}>
              <Suspense fallback={<BookmarkButtonSkeleton className="grow" />}>
                <BookmarkButton className="grow" manga={manga} source={source} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </Modal>
    </>
  )
}
