import type { BasePageProps } from '@/types/nextjs'

import MangaCard from '@/components/card/MangaCard'
import { hashaMangaIdsDesc, hashaMangas } from '@/database/hasha'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  return (
    <div className="p-2">
      <h1 className="text-lg font-bold">준비 중입니다</h1>
    </div>
  )
}
