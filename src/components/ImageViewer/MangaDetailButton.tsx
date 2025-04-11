import { harpiTagMap } from '@/database/harpi-tag'
import { Manga } from '@/types/manga'
import { SourceParam } from '@/utils/param'
import { ErrorBoundary, Suspense } from '@suspensive/react'
import dayjs from 'dayjs'
import { memo, useState } from 'react'

import BookmarkButton, { BookmarkButtonError, BookmarkButtonSkeleton } from '../card/BookmarkButton'
import ImageDownloadButton from '../card/ImageDownloadButton'
import TagList from '../TagList'
import Modal from '../ui/Modal'

type Props = {
  manga: Manga
  source: SourceParam
}

export default memo(MangaDetailButton)

function MangaDetailButton({ manga, source }: Props) {
  const { title, artists, group, series, characters, type, tags, date } = manga
  const [isOpened, setIsOpened] = useState(false)

  const translatedTags = tags
    ?.map((tag) => harpiTagMap[tag] || tag)
    ?.map((tag) => (typeof tag === 'string' ? tag : tag.korStr || tag.engStr))

  return (
    <>
      <button className="hover:underline" onClick={() => setIsOpened(true)} type="button">
        <h1 className="flex-1 text-center line-clamp-1 font-bold text-foreground md:text-lg">{title}</h1>
      </button>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <div className="bg-zinc-900 min-w-3xs w-screen max-w-sm md:max-w-lg rounded-xl p-4 pt-8 shadow-xl border grid gap-3 text-sm md:text-base">
          <h2 className="font-bold text-lg md:text-xl">{title}</h2>
          <div className="grid grid-cols-[auto_1fr] gap-2">
            {type && (
              <>
                <strong>종류</strong>
                <div>{type}</div>
              </>
            )}
            {artists && artists.length > 0 && (
              <>
                <strong>작가</strong>
                <div>{artists.join(', ')}</div>
              </>
            )}
            {group && group.length > 0 && (
              <>
                <strong>그룹</strong>
                <div>{group.join(', ')}</div>
              </>
            )}
            {series && series.length > 0 && (
              <>
                <strong>시리즈</strong>
                <div>{series.join(', ')}</div>
              </>
            )}
            {characters && characters.length > 0 && (
              <>
                <strong>캐릭터</strong>
                <div>{characters.join(', ')}</div>
              </>
            )}
            {translatedTags && translatedTags.length > 0 && (
              <>
                <strong>태그</strong>
                <TagList
                  className="flex flex-wrap gap-1 font-medium [&_li]:rounded [&_li]:px-1 [&_li]:text-foreground"
                  tags={translatedTags}
                />
              </>
            )}
            {date && (
              <>
                <strong>날짜</strong>
                <div>{dayjs(date).format('YYYY-MM-DD HH:mm')}</div>
              </>
            )}
          </div>
          <div className="flex flex-wrap justify-around gap-2 text-sm [&_button]:disabled:bg-zinc-800 [&_button]:disabled:pointer-events-none [&_button]:disabled:text-zinc-500">
            <ImageDownloadButton className="grow" manga={manga} />
            <ErrorBoundary fallback={BookmarkButtonError}>
              <Suspense clientOnly fallback={<BookmarkButtonSkeleton className="grow" />}>
                <BookmarkButton className="grow" manga={manga} source={source} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </Modal>
    </>
  )
}
