import { cookies } from 'next/headers'

import { MangaCardSkeleton } from '@/components/card/MangaCard'
import { ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

export default async function Loading() {
  const cookieStore = await cookies()
  const view = (cookieStore.get('view')?.value as ViewCookie) ?? ViewCookie.CARD
  const skeletonCount = view === ViewCookie.IMAGE ? 12 : 6

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2 grow`}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <MangaCardSkeleton key={i} />
      ))}
    </ul>
  )
}
