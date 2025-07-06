'use client'

import { useSearchQuery } from '@/app/(navigation)/search/useSearchQuery'
import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import { getViewerLink } from '@/utils/manga'
import { SourceParam, ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

type Props = {
  view: ViewCookie
}

export default function SearchResults({ view }: Props) {
  const { data: mangas } = useSearchQuery()

  if (!mangas || mangas.length === 0) {
    return (
      <div className="flex flex-col grow justify-center items-center">
        <p className="text-zinc-500">검색 결과가 없습니다.</p>
      </div>
    )
  }

  return (
    <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2 grow`}>
      {mangas.map((manga, i) =>
        view === ViewCookie.IMAGE ? (
          <MangaCardImage
            className="bg-zinc-900 rounded-xl border-2 relative [&_img]:snap-start [&_img]:flex-shrink-0 [&_img]:w-full [&_img]:object-cover [&_img]:aspect-[3/4]"
            href={getViewerLink(manga.id, SourceParam.K_HENTAI)}
            index={i}
            key={manga.id}
            manga={manga}
          />
        ) : (
          <MangaCard index={i} key={manga.id} manga={manga} source={SourceParam.K_HENTAI} />
        ),
      )}
    </ul>
  )
}
