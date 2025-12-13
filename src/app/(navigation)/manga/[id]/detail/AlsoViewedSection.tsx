import { Eye } from 'lucide-react'

import MangaCardList from './MangaCardList'
import { getAlsoViewed } from './queries.server'

type Props = {
  mangaId: number
}

export default async function AlsoViewedSection({ mangaId }: Props) {
  const alsoViewedIds = await getAlsoViewed(mangaId)

  if (alsoViewedIds.length === 0) {
    return null
  }

  return (
    <div className="border-b-2 p-4">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
        <Eye className="size-4" />이 작품과 함께 본 작품
      </h3>
      <MangaCardList mangaIds={alsoViewedIds} />
    </div>
  )
}
