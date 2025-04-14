import { MangaCardSkeleton } from '@/components/card/MangaCard'

export default function Loading() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-2 grow">
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
      <MangaCardSkeleton />
    </ul>
  )
}
