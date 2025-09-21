import { redirect } from 'next/navigation'

import { DEFAULT_METRIC, DEFAULT_PERIOD } from '../common'

export const dynamic = 'force-static'

export default async function Page() {
  redirect(`/ranking/${DEFAULT_METRIC}/${DEFAULT_PERIOD}`)
}
