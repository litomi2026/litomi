import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod'

import { fetchMangasFromMultiSources } from '@/common/manga'
import MangaCard from '@/components/card/MangaCard'
import MangaCardDonation from '@/components/card/MangaCardDonation'
import { generateOpenGraphMetadata } from '@/constants'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

import { metricInfo, MetricParam, periodLabels, PeriodParam } from '../../../common'
import { getRankingData } from './query'

export const revalidate = 43200 // 12 hours

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
  const title = `${periodLabels[period]} ${metricInfo[metric].label} 순위`

  return {
    title,
    ...generateOpenGraphMetadata({
      title,
      url: `/ranking/${metric}/${period}`,
    }),
    alternates: {
      canonical: `/ranking/${metric}/${period}`,
      languages: { ko: `/ranking/${metric}/${period}` },
    },
  }
}

export async function generateStaticParams() {
  const params = []
  for (const metric of Object.values(MetricParam)) {
    for (const period of Object.values(PeriodParam)) {
      params.push({ metric, period })
    }
  }
  return params
}

export default async function Page({ params }: PageProps<'/ranking/[metric]/[period]'>) {
  const validation = mangasRankingSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { metric, period } = validation.data
  const rankings = await getRankingData(metric, period)

  if (!rankings) {
    notFound()
  }

  const [mangasMap1, mangasMap2] = await Promise.all([
    fetchMangasFromMultiSources(rankings.map((ranking) => ranking.mangaId).slice(0, 10)),
    fetchMangasFromMultiSources(rankings.map((ranking) => ranking.mangaId).slice(10, 20)),
  ])

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2 p-2`}>
      {rankings.map((ranking, i) => (
        <MangaCard index={i} key={ranking.mangaId} manga={mangasMap1[ranking.mangaId] || mangasMap2[ranking.mangaId]} />
      ))}
      <MangaCardDonation />
    </ul>
  )
}
