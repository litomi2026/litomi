'use client'

import type { Manga } from '@litomi/domain/manga/model'
import { MAX_MANGA_DESCRIPTION_LENGTH } from '@litomi/domain/manga/policy'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { ErrorBoundary } from '@suspensive/react'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { create } from 'zustand'

import BookmarkButton, { BookmarkButtonError } from '@/components/card/BookmarkButton'
import DownloadButton, { DownloadButtonError } from '@/components/card/DownloadButton'
import MangaCardStats from '@/components/card/MangaCardStats'
import MangaMetadataLink from '@/components/card/MangaMetadataLink'
import MangaMetadataList from '@/components/card/MangaMetadataList'
import MangaMetadataListWithLink from '@/components/card/MangaMetadataListWithLink'
import MangaTagList from '@/components/card/MangaTagList'
import { Link, usePathname } from '@/i18n/navigation'
import { MANGA_INITIAL_LINES } from '@/ui-policy'

type MangaDetailModalStore = {
  isOpen: boolean
  params: Params
  setIsOpen: (isOpen: boolean) => void
  setParams: (params?: Params) => void
}

type Params = {
  manga?: Manga
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
  const { isOpen, params, setParams } = useMangaDetailModalStore()
  const { close } = useMangaDetailModal()
  const pathname = usePathname()
  const t = useTranslations('MangaViewer.detail')
  const { manga = {} as Manga } = params

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
    count,
  } = manga

  const isDownloadable = images?.length === count
  const shouldTruncateDescription = description && description.length > MAX_MANGA_DESCRIPTION_LENGTH
  const hasMoreLines = lines && lines.length > MANGA_INITIAL_LINES
  const displayLines = showAllLines ? lines : lines?.slice(0, MANGA_INITIAL_LINES)

  const displayDescription =
    shouldTruncateDescription && !showFullDescription
      ? description.slice(0, MAX_MANGA_DESCRIPTION_LENGTH) + '...'
      : description

  const actionButtonBaseClassName = twMerge(
    'inline-flex w-full items-center justify-center gap-2 rounded-xl p-3 py-2 font-semibold',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0',
  )

  const primaryButtonClassName = twMerge(
    actionButtonBaseClassName,
    'bg-foreground text-background hover:bg-foreground/90 active:bg-foreground/80',
    'disabled:bg-foreground disabled:text-background disabled:opacity-50',
  )

  const secondaryButtonClassName = twMerge(
    actionButtonBaseClassName,
    'border border-foreground/15 bg-transparent text-foreground hover:bg-foreground/10 active:bg-foreground/15',
    'disabled:border-foreground/10 disabled:bg-zinc-900 disabled:text-zinc-500',
  )

  // NOTE: 페이지 이동 시 모달 닫기
  useEffect(() => {
    close()
  }, [pathname, close])

  return (
    <Dialog
      ariaLabel={t('modalTitle')}
      className="text-sm md:text-base"
      onAfterClose={() => setParams()}
      onClose={close}
      open={isOpen}
    >
      <DialogHeader onClose={close} title={t('modalTitle')} />
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
                  {showFullDescription ? t('showLess') : t('showMore')}
                </button>
              )}
            </p>
          </div>
        )}

        <div className="flex-1">
          <div className="flex flex-col gap-2 [&_strong]:whitespace-nowrap">
            <div className="flex gap-2 min-w-0">
              <strong>{t('fields.id')}</strong>
              <div className="min-w-0 flex-1">
                <MangaMetadataLink filterType="id" value={id?.toString() ?? ''} />
              </div>
            </div>
            {languages && languages.length > 0 && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.language')}</strong>
                <div className="min-w-0 flex-1">
                  <MangaMetadataList filterType="language" labeledValues={languages} />
                </div>
              </div>
            )}
            {type && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.type')}</strong>
                <div className="min-w-0 flex-1">
                  <MangaMetadataLink filterType="type" label={type.label} value={type.value} />
                </div>
              </div>
            )}
            {artists && artists.length > 0 && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.artist')}</strong>
                <div className="min-w-0 flex-1">
                  <MangaMetadataListWithLink filterType="artist" items={artists} />
                </div>
              </div>
            )}
            {group && group.length > 0 && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.group')}</strong>
                <div className="min-w-0 flex-1">
                  <MangaMetadataList filterType="group" labeledValues={group} />
                </div>
              </div>
            )}
            {series && series.length > 0 && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.series')}</strong>
                <div className="min-w-0 flex-1">
                  <MangaMetadataList filterType="series" labeledValues={series} />
                </div>
              </div>
            )}
            {characters && characters.length > 0 && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.character')}</strong>
                <div className="min-w-0 flex-1">
                  <MangaMetadataListWithLink filterType="character" items={characters} />
                </div>
              </div>
            )}
            {uploader && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.uploader')}</strong>
                <div className="min-w-0 flex-1">
                  <MangaMetadataLink filterType="uploader" value={uploader} />
                </div>
              </div>
            )}
            {date && (
              <div className="flex gap-2 min-w-0">
                <strong>{t('fields.date')}</strong>
                <div className="min-w-0 flex-1">
                  <Link
                    className="hover:underline focus:underline break-all"
                    href={`/search?to=${Math.ceil(new Date(date).getTime() / 1000) + 60}`}
                    prefetch={false}
                  >
                    {dayjs(date).format('YYYY-MM-DD HH:mm')}
                  </Link>
                </div>
              </div>
            )}
            {tags && tags.length > 0 && <MangaTagList className="font-medium" tags={tags} />}
            <MangaCardStats manga={manga} />
          </div>

          {lines && lines.length > 0 && (
            <div className="border-t border-zinc-800 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-zinc-400 text-sm font-medium">{t('linePreview')}</span>
                {hasMoreLines && (
                  <button
                    className="text-brand font-medium group-hover:underline transition text-xs"
                    onClick={() => setShowAllLines(!showAllLines)}
                    type="button"
                  >
                    {showAllLines
                      ? t('collapse')
                      : t('showMoreWithCount', { count: lines.length - MANGA_INITIAL_LINES })}
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
        </div>
      </DialogBody>
      <DialogFooter className="grid gap-2 text-sm">
        <ErrorBoundary fallback={BookmarkButtonError}>
          <BookmarkButton className={primaryButtonClassName} manga={manga} />
        </ErrorBoundary>
        {isDownloadable && (
          <ErrorBoundary fallback={DownloadButtonError}>
            <DownloadButton className={secondaryButtonClassName} manga={manga} />
          </ErrorBoundary>
        )}
      </DialogFooter>
    </Dialog>
  )
}
