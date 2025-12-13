import { Heart } from 'lucide-react'

import MangaCardList from './MangaCardList'
import { getRecommendedByUsers } from './queries.server'

type Props = {
  mangaId: number
}

export default async function RecommendedByUsersSection({ mangaId }: Props) {
  const recommendedIds = await getRecommendedByUsers(mangaId)

  if (recommendedIds.length === 0) {
    return null
  }

  return (
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Heart className="size-4" />이 작품과 함께 좋아한 작품
      </h3>
      <MangaCardList mangaIds={recommendedIds} />
    </div>
  )
}
