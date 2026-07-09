'use client'

import { MAX_MANGA_RECOMMENDATION_PER_PAGE } from '@litomi/domain/manga-recommendation/policy'
import { View } from '@litomi/std'
import dayjs from 'dayjs'
import { Compass, RefreshCw, Target } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import AdultVerificationGate from '@/components/AdultVerificationGate'
import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import LoginGate from '@/components/LoginGate'
import StatusState from '@/components/status/StatusState'
import { getStatusActionClassName } from '@/components/status/styles'
import useMangaCensorship from '@/hook/useMangaCensorship'
import useMangaListCachedQuery from '@/hook/useMangaListCachedQuery'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { createLoadingManga } from '@/utils/manga-placeholder'
import { MANGA_GRID_COLUMN } from '@/utils/style'
import useMangaRecommendationQuery from './useMangaRecommendationQuery'

export default function RecommendMangaPageClient() {
  const { heavySignature, isVisible } = useMangaCensorship()
  const t = useTranslations('RecommendManga')
  const { data: me } = useMeQuery()
  const canAccess = hasAdultAccess(me)

  const { data, error, isFetching, isPending, refetch } = useMangaRecommendationQuery({
    enabled: canAccess,
    limit: MAX_MANGA_RECOMMENDATION_PER_PAGE,
    userId: me?.id,
  })

  const recommendations = data?.items ?? []
  const mangaIds = recommendations.map((item) => item.mangaId)

  const { mangaMap } = useMangaListCachedQuery({
    mangaIds,
    catalogMangas: recommendations.map(({ manga }) => manga),
  })

  const visibleRecommendations = recommendations.filter((item) => isVisible(mangaMap.get(item.mangaId)))
  const generatedAt = recommendations[0]?.generatedAt

  if (me === undefined) {
    return <LoadingState />
  }

  if (me === null) {
    return <LoginGate />
  }

  if (!canAccess) {
    return <AdultVerificationGate description={t('adultGateDescription')} />
  }

  if (isPending) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState isFetching={isFetching} onRetry={() => refetch()} />
  }

  if (recommendations.length === 0) {
    return <EmptyState />
  }

  return (
    <>
      <JuicyAdsBanner />
      <section className="flex flex-col gap-3 p-2">
        <header className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <Compass className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground">추천 작품</h1>
              {generatedAt && (
                <p className="text-xs text-zinc-500" title={dayjs(generatedAt).format('YYYY-MM-DD HH:mm')}>
                  {dayjs(generatedAt).format('YYYY년 M월 D일')} 갱신
                </p>
              )}
            </div>
          </div>
        </header>

        {visibleRecommendations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={`grid ${MANGA_GRID_COLUMN.card} gap-2`}>
            {visibleRecommendations.map(({ rank, mangaId }, index) => (
              <MangaCard
                className="h-full"
                index={index}
                key={`${rank}-${mangaId}-${heavySignature}`}
                manga={mangaMap.get(mangaId) ?? createLoadingManga(mangaId)}
                rank={rank}
                variant={View.CARD}
              />
            ))}
          </div>
        )}
      </section>
      <MobileNavigationSpacer />
    </>
  )
}

function EmptyState() {
  return (
    <StatusState
      description="작품을 감상하거나 평가하면 다음 추천에 반영돼요"
      icon={<Compass className="size-8" />}
      title="추천 작품이 아직 없어요"
    />
  )
}

function ErrorState({ isFetching, onRetry }: { isFetching: boolean; onRetry: () => void }) {
  return (
    <StatusState
      description="잠시 후 다시 시도해 주세요"
      icon={<Target className="size-8" />}
      title="추천 작품을 불러오지 못했어요"
    >
      <button className={getStatusActionClassName('secondary')} disabled={isFetching} onClick={onRetry} type="button">
        <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
        다시 불러오기
      </button>
    </StatusState>
  )
}

function LoadingState() {
  return (
    <section className="grid gap-3 p-2">
      <div className="h-16 rounded-lg border border-zinc-800 bg-zinc-950/60" />
      <div className={`grid ${MANGA_GRID_COLUMN.card} gap-2`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <MangaCardSkeleton key={index} />
        ))}
      </div>
    </section>
  )
}
