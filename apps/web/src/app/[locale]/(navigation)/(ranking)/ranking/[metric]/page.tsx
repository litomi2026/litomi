import { redirect } from '@/i18n/navigation'
import { getLocaleFromParams } from '@/i18n/server'

import { DEFAULT_METRIC, DEFAULT_PERIOD, MetricParam } from '../../common'

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(MetricParam).map((metric) => ({ metric }))
}

export default async function Page({ params }: PageProps<'/[locale]/ranking/[metric]'>) {
  const locale = await getLocaleFromParams(params)
  redirect({ href: `/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`, locale })
}
