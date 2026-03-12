'use client'

import Cookies from 'js-cookie'
import dynamic from 'next/dynamic'
import { useState } from 'react'

import type { Manga } from '@/types/manga'

import { AD_SLOTS } from '@/components/ads/juicy-ads/constants'
import NonAdultJuicyAdsBanner from '@/components/ads/juicy-ads/NonAdultJuicyAdsBanner'
import LoginPageLink from '@/components/LoginPageLink'
import { CookieKey } from '@/constants/storage'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useMeQuery from '@/query/useMeQuery'

import ImageViewer from './ImageViewer/ImageViewer'
import usePageMetadata from './usePageMetadata'

const NotFound = dynamic(() => import('./not-found'))

type Props = {
  id: number
  initialManga?: Manga | null
}

export default function MangaViewer({ id, initialManga }: Readonly<Props>) {
  const [hasClickedAd, setHasClickedAd] = useState(false)
  const { data: me, isPending: isMePending } = useMeQuery()
  const hasAuthHint = Cookies.get(CookieKey.AUTH_HINT) === '1'
  const shouldFetch = (initialManga?.images?.length ?? 0) === 0

  // 미로그인 사용자는 광고를 클릭해야만 패치하도록 합니다.
  const isWaitingForAdClick = shouldFetch && !me && !hasClickedAd
  const actualShouldFetch = shouldFetch && !isWaitingForAdClick

  const { mangaMap } = useMangaListCachedQuery({ mangaIds: actualShouldFetch ? [id] : [] }) // TODO: 모든 작품 이미지를 R2 저장소로 자동 관리할 떄 지우기
  const data = mangaMap.get(id) ?? (actualShouldFetch && !initialManga ? { id, title: '불러오는 중' } : undefined)
  const manga = prepareManga(data, initialManga)
  const metadata = prepareMetadata(manga)

  // NOTE: Vercel Fluid Active CPU 비용을 줄이기 위해
  usePageMetadata(metadata)

  // NOTE: 로그인 사용자는 me 응답이 올 때까지 잠깐 숨겨서 깜빡임을 막아요.
  if (hasAuthHint && isMePending) {
    return null
  }

  if (isWaitingForAdClick) {
    return (
      <NonAdultJuicyAdsBanner
        className="h-full flex flex-col gap-4 items-center justify-center"
        onAdClick={() => setHasClickedAd(true)}
        slots={[AD_SLOTS.BANNER_308X286]}
        subtitle={
          <div>
            <LoginPageLink className="text-zinc-400">로그인</LoginPageLink>을 하면 광고를 보지 않고도 작품을 볼 수
            있어요.
          </div>
        }
        title="작품을 보려면 광고를 클릭해주세요."
      />
    )
  }

  if (!manga) {
    return <NotFound />
  }

  return <ImageViewer manga={manga} />
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

function prepareMetadata(manga: Manga | null | undefined) {
  if (!manga || !manga.images || manga.images.length === 0) {
    return {}
  }

  const parts: string[] = []

  if (manga.artists && manga.artists.length > 0) {
    const artistNames = manga.artists
      .slice(0, 3)
      .map((a) => a.label)
      .join(', ')
    parts.push(`작가: ${artistNames}`)
  }

  if (manga.series && manga.series.length > 0) {
    const seriesNames = manga.series
      .slice(0, 2)
      .map((s) => s.label)
      .join(', ')
    parts.push(`시리즈: ${seriesNames}`)
  }

  if (manga.characters && manga.characters.length > 0) {
    const characterNames = manga.characters
      .slice(0, 3)
      .map((c) => c.label)
      .join(', ')
    parts.push(`캐릭터: ${characterNames}`)
  }

  if (manga.tags && manga.tags.length > 0) {
    const tagNames = manga.tags
      .slice(0, 5)
      .map((t) => t.label)
      .join(', ')
    parts.push(`태그: ${tagNames}`)
  }

  if (manga.type) {
    parts.push(`종류: ${manga.type}`)
  }

  if (manga.languages && manga.languages.length > 0) {
    const languages = manga.languages.map((l) => l.label).join(', ')
    parts.push(`언어: ${languages}`)
  }

  if (manga.count) {
    parts.push(`${manga.count} 페이지`)
  }

  const description = manga.description || parts.join(' • ')
  const firstImage = manga.images[0]

  return {
    title: manga.title,
    description,
    image: firstImage.original?.url ?? firstImage.thumbnail?.url ?? '',
  }
}
