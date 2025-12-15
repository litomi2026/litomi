import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod'

import { generateOpenGraphMetadata } from '@/constants'

import { metricInfo, MetricParam, periodLabels, PeriodParam } from '../../../common'
import { getRankingData } from './query'
import RankingList from './RankingList'

export const dynamic = 'force-static'
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

  return <RankingList rankings={rankings} />
}
