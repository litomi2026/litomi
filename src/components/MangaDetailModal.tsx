'use client'

import { ErrorBoundary } from '@suspensive/react'
import dayjs from 'dayjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, Suspense, useEffect, useState } from 'react'
import { create } from 'zustand'

import BookmarkButton, { BookmarkButtonError } from '@/components/card/BookmarkButton'
import DownloadButton, { DownloadButtonError } from '@/components/card/DownloadButton'
import MangaCardStats from '@/components/card/MangaCardStats'
import MangaMetadataLabel from '@/components/card/MangaMetadataLabel'
import MangaMetadataLink from '@/components/card/MangaMetadataLink'
import MangaMetadataList from '@/components/card/MangaMetadataList'
import MangaMetadataListWithLink from '@/components/card/MangaMetadataListWithLink'
import MangaTagList from '@/components/card/MangaTagList'
import Modal from '@/components/ui/Modal'
import { MANGA_INITIAL_LINES, MAX_MANGA_DESCRIPTION_LENGTH } from '@/constants/policy'
import { Manga } from '@/types/manga'

type MangaDetailModalStore = {
  isOpen: boolean
  params: Params
  setIsOpen: (isOpen: boolean) => void
  setParams: (params?: Params) => void
}

type Params = {
  manga?: Manga
  children?: ReactNode
}

const useMangaDetailModalStore = create<MangaDetailModalStore>()((set) => ({
  isOpen: false,
  params: {},
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
  setParams: (params: Params = {}) => set({ params }),
}))

export const useMangaDetailModal = () => {
  const setIsOpen = useMangaDetailModalStore((store) => store.setIsOpen)
  const setParams = useMangaDetailModalStore((store) => store.setParams)

  return {
    open: (params?: Params) => {
      setIsOpen(true)
      setParams(params)
    },
    close: () => {
      setIsOpen(false)
      setTimeout(() => {
        setParams()
      }, 300)
    },
  }
}

export function MangaDetailModal() {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAllLines, setShowAllLines] = useState(false)
  const pathname = usePathname()
  const { isOpen, params } = useMangaDetailModalStore()
  const { close } = useMangaDetailModal()
  const { manga = {} as Manga, children } = params

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

  const isDownloadable = images?.[0]?.original?.url?.includes('soujpa.in')
  const shouldTruncateDescription = description && description.length > MAX_MANGA_DESCRIPTION_LENGTH
  const hasMoreLines = lines && lines.length > MANGA_INITIAL_LINES
  const displayLines = showAllLines ? lines : lines?.slice(0, MANGA_INITIAL_LINES)

  const displayDescription =
    shouldTruncateDescription && !showFullDescription
      ? description.slice(0, MAX_MANGA_DESCRIPTION_LENGTH) + '...'
      : description

  const commonButtonStyle =
    'flex-1 bg-zinc-900 rounded-lg p-1 px-2 border-2 h-full w-full transition disabled:bg-zinc-800 disabled:pointer-events-none disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-zinc-800 active:bg-zinc-900 active:border-zinc-700'

  // NOTE: 페이지 이동 시 모달 닫기
  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <Modal onClose={close} open={isOpen} showCloseButton showDragButton>
      <div className="bg-zinc-900 min-w-3xs w-screen max-w-prose rounded-xl p-4 pt-8 shadow-xl border grid gap-4 text-sm overflow-y-auto max-h-[calc(100vh-var(--safe-area-bottom))] md:text-base">
        <h2 className="font-bold text-lg md:text-xl">{title}</h2>
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
        <div className="grid gap-2 [&_strong]:whitespace-nowrap">
          <div className="flex gap-2">
            <strong>품번</strong>
            <Suspense>
              <MangaMetadataLink filterType="id" value={id?.toString() ?? ''} />
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
              <MangaMetadataListWithLink filterType="artist" items={artists} />
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
              <MangaMetadataListWithLink filterType="character" items={characters} />
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
        <div className="flex gap-2 text-sm">
          <ErrorBoundary fallback={BookmarkButtonError}>
            <BookmarkButton className={commonButtonStyle} manga={manga} />
          </ErrorBoundary>
          {isDownloadable && (
            <ErrorBoundary fallback={DownloadButtonError}>
              <DownloadButton className={commonButtonStyle} manga={manga} />
            </ErrorBoundary>
          )}
        </div>
        {children}
      </div>
    </Modal>
  )
}
