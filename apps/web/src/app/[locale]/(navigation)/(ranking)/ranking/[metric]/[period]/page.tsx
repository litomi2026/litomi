import { getNativeGridSponsor } from '@litomi/catalog/sponsor/native-grid'
import { nativeGridSponsorPlacement } from '@litomi/domain/sponsor/native-grid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import z from 'zod'

import JuicyAdsBanner from '@/components/ads/juicy-ads/JuicyAdsBanner'
import { getLocaleFromParams } from '@/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'
import { MANGA_GRID_COLUMN } from '@/utils/style'

import { MetricParam, PeriodParam } from '../../../common'
import { getRankingData } from './query'
import RankingList from './RankingList'

export const revalidate = 43200 // 12 hours
export const dynamicParams = false

const mangasRankingSchema = z.object({
  metric: z.enum(MetricParam),
  period: z.enum(PeriodParam),
})

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/ranking/[metric]/[period]'>): Promise<Metadata> {
  const locale = await getLocaleFromParams(params)
  const validation = mangasRankingSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { metric, period } = validation.data
  const t = await getTranslations({ locale, namespace: 'Metadata.ranking' })
  const title = t('title', { metric: t(`metrics.${metric}`), period: t(`periods.${period}`) })

  return {
    title,
    ...generateLocalizedMetadata({
      title,
      locale,
      pathname: `/ranking/${metric}/${period}`,
    }),
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

export default async function Page({ params }: PageProps<'/[locale]/ranking/[metric]/[period]'>) {
  const locale = await getLocaleFromParams(params)
  const validation = mangasRankingSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { metric, period } = validation.data
  const rankings = await getRankingData(metric, period, locale)
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
