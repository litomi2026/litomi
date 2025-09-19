import { redirect } from 'next/navigation'

import { MetricParam, PeriodParam } from './[period]/common'

export const dynamic = 'force-static'

export default async function Page() {
  redirect(`/mangas/top/${MetricParam.VIEW}/${PeriodParam.ALL}`)
}
