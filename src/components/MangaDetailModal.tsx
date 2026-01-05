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
import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogHeader from '@/components/ui/DialogHeader'
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
    },
  }
}

export function MangaDetailModal() {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAllLines, setShowAllLines] = useState(false)
  const pathname = usePathname()
  const { isOpen, params, setParams } = useMangaDetailModalStore()
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

  const commonButtonStyle = 'flex-1 bg-zinc-900 rounded-lg p-1 px-2 border-2 h-full w-full'

  // NOTE: 페이지 이동 시 모달 닫기
  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <Dialog
      ariaLabel="작품 정보"
      className="text-sm md:text-base"
      onAfterClose={() => setParams()}
      onClose={close}
      open={isOpen}
    >
      <DialogHeader onClose={close} title="작품 정보" />
      <DialogBody className="flex flex-col gap-4">
        <h3 className="font-bold text-lg md:text-xl">{title}</h3>
        {description && (
          <div className="bg-zinc-800/30 rounded-lg p-3">
            <p className="text-zinc-300 leading-relaxed">
              {displayDescription}
              {shouldTruncateDescription && (
                <button
                  className="ml-1 text-brand font-medium hover:underline transition text-sm"
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
          <div className="flex gap-2 min-w-0">
            <strong>품번</strong>
            <div className="min-w-0 flex-1">
              <Suspense>
                <MangaMetadataLink filterType="id" value={id?.toString() ?? ''} />
              </Suspense>
            </div>
          </div>
          {languages && languages.length > 0 && (
            <div className="flex gap-2 min-w-0">
              <strong>언어</strong>
              <div className="min-w-0 flex-1">
                <MangaMetadataList filterType="language" labeledValues={languages} />
              </div>
            </div>
          )}
          {type && (
            <div className="flex gap-2 min-w-0">
              <strong>종류</strong>
              <div className="min-w-0 flex-1">
                <Suspense>
                  <MangaMetadataLink filterType="type" label={type.label} value={type.value} />
                </Suspense>
              </div>
            </div>
          )}
          {artists && artists.length > 0 && (
            <div className="flex gap-2 min-w-0">
              <strong>작가</strong>
              <div className="min-w-0 flex-1">
                <MangaMetadataListWithLink filterType="artist" items={artists} />
              </div>
            </div>
          )}
          {group && group.length > 0 && (
            <div className="flex gap-2 min-w-0">
              <strong>그룹</strong>
              <div className="min-w-0 flex-1">
                <MangaMetadataList filterType="group" labeledValues={group} />
              </div>
            </div>
          )}
          {series && series.length > 0 && (
            <div className="flex gap-2 min-w-0">
              <strong>시리즈</strong>
              <div className="min-w-0 flex-1">
                <MangaMetadataList filterType="series" labeledValues={series} />
              </div>
            </div>
          )}
          {characters && characters.length > 0 && (
            <div className="flex gap-2 min-w-0">
              <strong>캐릭터</strong>
              <div className="min-w-0 flex-1">
                <MangaMetadataListWithLink filterType="character" items={characters} />
              </div>
            </div>
          )}
          {uploader && (
            <div className="flex gap-2 min-w-0">
              <strong>업로더</strong>
              <div className="min-w-0 flex-1">
                <Suspense>
                  <MangaMetadataLink filterType="uploader" value={uploader} />
                </Suspense>
              </div>
            </div>
          )}
          {date && (
            <div className="flex gap-2 min-w-0">
              <strong>날짜</strong>
              <div className="min-w-0 flex-1">
                <Link
                  className="hover:underline focus:underline break-all"
                  href={`/search?to=${Math.ceil(new Date(date).getTime() / 1000) + 60}`}
                  prefetch={false}
                >
                  <MangaMetadataLabel>{dayjs(date).format('YYYY-MM-DD HH:mm')}</MangaMetadataLabel>
                </Link>
              </div>
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
                  className="text-brand font-medium group-hover:underline transition text-xs"
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
      </DialogBody>
    </Dialog>
  )
}
