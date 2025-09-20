import { redirect } from 'next/navigation'

import { SourceParam } from '@/utils/param'

export const dynamic = 'force-static'

export default async function Page() {
  redirect(`/mangas/random/${SourceParam.K_HENTAI}/card`)
}
