import type { PublicLocale } from '@litomi/domain/locale'

import { ChevronRight, Flame } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { MobileNavigationSpacer } from '@/app/[locale]/(navigation)/NavigationSpacers'
import { MangaCardSkeleton } from '@/components/card/MangaCard'
import { Link } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import { MetricParam, PeriodParam } from '../(ranking)/common'
import { getRankingData } from '../(ranking)/ranking/[metric]/[period]/query'
import RankingList from '../(ranking)/ranking/[metric]/[period]/RankingList'

export const revalidate = 21600 // 6 hours

export default async function Layout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await getLocaleFromParams(params)
  const t = await getTranslations({ locale, namespace: 'RightAside.dailyRanking' })

  return (
    <div className="grid min-h-full grow lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col lg:border-r">{children}</div>
      <aside aria-label={t('title')} className="hidden min-w-0 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col overflow-y-auto scrollbar-hidden">
          <div className="sticky top-0 z-20 border-b bg-background/85 pt-safe backdrop-blur">
            <div className="flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-700/80 bg-zinc-900/80 text-brand shadow-sm">
                  <Flame aria-hidden className="size-4 fill-current" />
                </span>
                <h2 className="min-w-0 truncate text-sm font-bold leading-5">{t('title')}</h2>
              </div>
              <Link
                className="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-lg px-2 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-900 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-700/70"
                href={`/ranking/${MetricParam.VIEW}/${PeriodParam.DAY}`}
                prefetch={false}
              >
                {t('viewAll')}
                <ChevronRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          </div>
          <Suspense fallback={<DailyRankingFallback />}>
            <DailyRanking locale={locale} />
          </Suspense>
        </div>
      </aside>
      <MobileNavigationSpacer />
    </div>
  )
}

async function DailyRanking({ locale }: { locale: PublicLocale }) {
  const rankings = await getRankingData(MetricParam.VIEW, PeriodParam.DAY, locale)

  if (!rankings) {
    return null
  }

  return <RankingList className="gap-3 p-3" rankings={rankings.slice(0, 5)} />
}

function DailyRankingFallback() {
  return (
    <ul className="grid gap-3 p-3">
      <MangaCardSkeleton />
      <MangaCardSkeleton />
    </ul>
  )
}
