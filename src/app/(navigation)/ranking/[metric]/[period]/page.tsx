import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod/v4'

import { getMangasFromMultiSources } from '@/common/manga'
import MangaCard from '@/components/card/MangaCard'
import { defaultOpenGraph, SHORT_NAME } from '@/constants'
import { sec } from '@/utils/date'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { metricInfo, MetricParam, periodLabels, PeriodParam } from '../../common'
import { getRankingData } from './query'

export const dynamic = 'force-static'

const mangasRankingSchema = z.object({
  metric: z.enum(MetricParam),
  period: z.enum(PeriodParam),
})

export async function generateMetadata({ params }: PageProps<'/ranking/[metric]/[period]'>): Promise<Metadata> {
  const validation = mangasRankingSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { metric, period } = validation.data
  const title = `${periodLabels[period]} ${metricInfo[metric].label} 순위 - ${SHORT_NAME}`

  return {
    title,
    openGraph: {
      ...defaultOpenGraph,
      title,
      url: `/ranking/${metric}/${period}`,
    },
    alternates: {
      canonical: `/ranking/${metric}/${period}`,
      languages: { ko: `/ranking/${metric}/${period}` },
    },
  }
}

export default async function Page({ params }: PageProps<'/ranking/[metric]/[period]'>) {
  const validation = mangasRankingSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { metric, period } = validation.data
  const rankings = await getRankingData(metric, period)
  console.log('👀 - Page - rankings:', rankings)

  if (!rankings) {
    notFound()
  }

  const revalidate = sec('1 day')

  const [mangasMap1, mangasMap2] = await Promise.all([
    getMangasFromMultiSources(rankings.map((ranking) => ranking.mangaId).slice(0, 10), revalidate),
    getMangasFromMultiSources(rankings.map((ranking) => ranking.mangaId).slice(10, 20), revalidate),
  ])

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2 p-4`}>
      {rankings.map((ranking, i) => (
        <MangaCard index={i} key={ranking.mangaId} manga={mangasMap1[ranking.mangaId] || mangasMap2[ranking.mangaId]} />
      ))}
    </ul>
  )
}
