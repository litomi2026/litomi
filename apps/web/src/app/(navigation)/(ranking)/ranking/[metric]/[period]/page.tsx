import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { generateOpenGraphMetadata } from '@/lib/metadata'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import { metricInfo, MetricParam, periodLabels, PeriodParam } from '../../../common'
import { getRankingData } from './query'
import RankingList from './RankingList'

export const revalidate = 21600 // 6 hours

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

export function generateStaticParams() {
  const metrics = [MetricParam.VIEW, MetricParam.BOOKMARK, MetricParam.LIBRARY, MetricParam.RATING]
  const periods = [PeriodParam.DAY, PeriodParam.WEEK, PeriodParam.MONTH, PeriodParam.QUARTER, PeriodParam.YEAR]
  const params = []

  for (const metric of metrics) {
    for (const period of periods) {
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
  const nativeGridSponsor = getNativeGridSponsor(nativeGridSponsorPlacement.RANKING)

  if (!rankings) {
    notFound()
  }

  return (
    <>
      <JuicyAdsBanner className="mt-2 mx-2" />
      <RankingList className={MANGA_GRID_COLUMN.card} nativeGridSponsor={nativeGridSponsor} rankings={rankings} />
    </>
  )
}
