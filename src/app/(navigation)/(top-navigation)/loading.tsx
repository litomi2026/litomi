import { MangaCardSkeleton } from '@/components/card/MangaCard'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

export default function Loading() {
  return (
    <ul className={`flex-1 grid ${MANGA_LIST_GRID_COLUMNS.card} gap-2`}>
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
    </ul>
  )
}
