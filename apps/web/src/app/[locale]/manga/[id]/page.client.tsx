'use client'

import type { Manga } from '@litomi/domain/manga/model'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { VIEWER_UNLOCK_NON_ADULT_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import LoginPageLink from '@/components/LoginPageLink'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import { Link } from '@/i18n/navigation'
import useMeQuery from '@/query/useMeQuery'
import { shouldShowAds } from '@/utils/adult-verification'
import { isAdultVerificationRequiredError } from '@/utils/adult-verification-error'
import { createLoadingManga } from '@/utils/manga-placeholder'

import MangaReader from './MangaReader'
import usePageMetadata from './usePageMetadata'

const NotFound = dynamic(() => import('./not-found'))

type Props = {
  id: number
  initialManga?: Manga | null
}

type Translator = ReturnType<typeof useTranslations>

export default function MangaPage({ id, initialManga }: Props) {
  const [hasBypassedAd, setHasBypassedAd] = useState(false)
  const { data: me } = useMeQuery()
  const isAdsVisible = shouldShowAds(me) && !hasBypassedAd
  const shouldLoadManga = me !== undefined && !isAdsVisible
  const mangaIds = shouldLoadManga ? [id] : []
  const { mangaMap, errorMap } = useMangaListCachedQuery({ mangaIds })
  const unlockT = useTranslations('MangaViewer.unlock')
  const metadataT = useTranslations('MangaViewer.metadata')
  const guardT = useTranslations('Common.guard')

  const data = mangaMap.get(id) ?? (shouldLoadManga && !initialManga ? createLoadingManga(id) : undefined)
  const manga = prepareManga(data, initialManga)
  const metadata = prepareMetadata(manga, metadataT)

  // NOTE: 클라이언트 측에서 메타데이터를 업데이트 해요
  usePageMetadata(metadata)

  if (isAdsVisible) {
    return (
      <div className="flex h-full flex-col gap-4 items-center justify-center p-4">
        <JuicyAdsBanner
          className="flex flex-col gap-3 items-center justify-center"
          layout={VIEWER_UNLOCK_NON_ADULT_AD_LAYOUT}
          onAdClick={() => setHasBypassedAd(true)}
          title={
            <div className="grid gap-0.5 text-center">
              <p className="text-zinc-300 text-sm">{unlockT('title')}</p>
              <p>
                {me ? (
                  <Link className="font-bold text-xs p-2 -m-2 text-foreground" href="/settings#adult">
                    {unlockT('adultAction')}
                  </Link>
                ) : (
                  <LoginPageLink className="text-foreground">{unlockT('adultActionGuest')}</LoginPageLink>
                )}
                {unlockT('adultSuffix')}
              </p>
            </div>
          }
        />
        <button
          className="w-full max-w-xs text-sm text-zinc-400 underline p-2"
          onClick={() => setHasBypassedAd(true)}
          type="button"
        >
          {unlockT('skipAd')}
        </button>
      </div>
    )
  }

  if (isAdultVerificationRequiredError(errorMap.get(id))) {
    return (
      <div className="flex min-h-dvh">
        <AdultVerificationGate description={guardT('adultDescription')} />
      </div>
    )
  }

  if (!manga) {
    return <NotFound />
  }

  return <MangaReader manga={manga} />
}

function prepareManga(data: Manga | undefined, initialManga: Manga | null | undefined): Manga | null | undefined {
  if (!data && !initialManga) {
    return null
  }

  // TODO: 모든 작품 이미지를 R2 저장소로 자동 관리할 떄 지우기
  if (initialManga?.images?.length) {
    return initialManga
  }

  if (!data?.images || data?.images.length === 0) {
    return initialManga ?? data
  }

  return initialManga ? { ...initialManga, ...data } : data
}

function prepareMetadata(manga: Manga | null | undefined, t: Translator) {
  if (!manga?.images || manga.images.length === 0) {
    return {}
  }

  const parts: string[] = []

  if (manga.artists && manga.artists.length > 0) {
    const artistNames = manga.artists
      .slice(0, 3)
      .map((a) => a.label)
      .join(', ')
    parts.push(`${t('artist')}: ${artistNames}`)
  }

  if (manga.series && manga.series.length > 0) {
    const seriesNames = manga.series
      .slice(0, 2)
      .map((s) => s.label)
      .join(', ')
    parts.push(`${t('series')}: ${seriesNames}`)
  }

  if (manga.characters && manga.characters.length > 0) {
    const characterNames = manga.characters
      .slice(0, 3)
      .map((c) => c.label)
      .join(', ')
    parts.push(`${t('character')}: ${characterNames}`)
  }

  if (manga.tags && manga.tags.length > 0) {
    const tagNames = manga.tags
      .slice(0, 5)
      .map((t) => t.label)
      .join(', ')
    parts.push(`${t('tag')}: ${tagNames}`)
  }

  if (manga.type) {
    parts.push(`${t('type')}: ${manga.type}`)
  }

  if (manga.languages && manga.languages.length > 0) {
    const languages = manga.languages.map((l) => l.label).join(', ')
    parts.push(`${t('language')}: ${languages}`)
  }

  if (manga.count) {
    parts.push(t('pages', { count: manga.count }))
  }

  const description = manga.description || parts.join(' • ')
  const firstImage = manga.images[0]

  return {
    title: manga.title,
    description,
    image: firstImage.original?.url ?? firstImage.thumbnail?.url ?? '',
  }
}
