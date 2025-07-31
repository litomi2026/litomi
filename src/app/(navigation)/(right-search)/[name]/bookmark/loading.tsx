import { MangaCardSkeleton } from '@/components/card/MangaCard'

export default function Loading() {
  return (
    <ul className="grid md:grid-cols-2 gap-2">
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
    </ul>
  )
}
