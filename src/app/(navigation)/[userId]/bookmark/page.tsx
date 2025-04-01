import type { BasePageProps } from '@/types/nextjs'

import MangaCard from '@/components/card/MangaCard'
import { hashaMangaIdsDesc, hashaMangas } from '@/database/hasha'

export default async function Page({ params }: BasePageProps) {
  return (
    <div className="p-2">
      <h1 className="text-lg font-bold">준비 중입니다</h1>
      <ul className="grid gap-2 md:grid-cols-2">
        {hashaMangaIdsDesc.slice(0, 1).map((id) => (
          <MangaCard key={id} manga={hashaMangas[id]} />
        ))}
      </ul>
    </div>
  )
}
