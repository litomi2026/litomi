'use client'

import type { Manga } from '@litomi/domain/manga/model'

import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { VIEWER_UNLOCK_NON_ADULT_AD_LAYOUT } from '@/components/ads/juicy-ads/layouts'
import LoginPageLink from '@/components/LoginPageLink'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useMeQuery from '@/query/useMeQuery'
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
  const unlockT = useTranslations('MangaViewer.unlock')
  const metadataT = useTranslations('MangaViewer.metadata')
  const [hasClickedAd, setHasClickedAd] = useState(false)
  const { data: me } = useMeQuery()
  const isWaitingForAdClick = !me && !hasClickedAd
  const mangaIds = isWaitingForAdClick ? [] : [id]
  const { mangaMap } = useMangaListCachedQuery({ mangaIds })

  const data = mangaMap.get(id) ?? (!isWaitingForAdClick && !initialManga ? createLoadingManga(id) : undefined)
  const manga = prepareManga(data, initialManga)
  const metadata = prepareMetadata(manga, metadataT)

  // NOTE: 클라이언트 측에서 메타데이터를 업데이트 해요
  usePageMetadata(metadata)

  // NOTE: 로그인 사용자는 me 응답이 올 때까지 잠깐 숨겨서 깜빡임을 막아요.
  if (me === undefined) {
    return null
  }

  if (isWaitingForAdClick) {
    return (
      <JuicyAdsBanner
        className="h-full flex flex-col gap-3 items-center justify-center"
        layout={VIEWER_UNLOCK_NON_ADULT_AD_LAYOUT}
        onAdClick={() => setHasClickedAd(true)}
        title={
          <div className="grid gap-0.5 text-center">
            <p className="text-zinc-300 text-sm">{unlockT('title')}</p>
            <p>
              {unlockT('loginPrefix')}
              <LoginPageLink className="text-foreground">{unlockT('loginAction')}</LoginPageLink>
              {unlockT('loginSuffix')}
            </p>
          </div>
        }
      />
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
  if (!manga || !manga.images || manga.images.length === 0) {
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
