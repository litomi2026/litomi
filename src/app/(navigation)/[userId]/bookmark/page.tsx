import type { BasePageProps } from '@/types/nextjs'

import MangaCard from '@/components/MangaCard'
import { mangaIdsDesc, mangas } from '@/database/manga'

export const dynamic = 'error'

export default async function Page({ params }: BasePageProps) {
  return (
    <div className="p-2">
      <h1 className="text-lg font-bold">준비 중입니다</h1>
      <ul className="grid gap-2 sm:grid-cols-2">
        {mangaIdsDesc.slice(0, 1).map((id) => (
          <MangaCard key={id} manga={mangas[id]} />
        ))}
      </ul>
    </div>
  )
}
