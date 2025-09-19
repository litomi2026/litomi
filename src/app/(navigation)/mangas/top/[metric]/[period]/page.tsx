import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import z from 'zod/v4'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'

import { MetricParam, PeriodParam } from './common'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: `인기 - ${SHORT_NAME}`,
  openGraph: {
    ...defaultOpenGraph,
    title: `인기 - ${SHORT_NAME}`,
    url: '/mangas/top',
  },
  alternates: {
    canonical: '/mangas/top',
    languages: { ko: '/mangas/top' },
  },
}

const mangasTopSchema = z.object({
  metric: z.enum(MetricParam),
  period: z.enum(PeriodParam),
})

export default async function Page({ params }: PageProps<'/mangas/top/[metric]/[period]'>) {
  const validation = mangasTopSchema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { metric, period } = validation.data

  return (
    <div>
      {metric} {period}
    </div>
  )
}
