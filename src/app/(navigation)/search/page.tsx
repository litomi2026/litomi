import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import { searchMangasFromKHentai } from '@/crawler/k-hentai'
import { BasePageProps } from '@/types/nextjs'
import { getJSONCookie } from '@/utils/cookie'
import { getViewerLink } from '@/utils/manga'
import { SourceParam, ViewParam } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { z } from 'zod'

const SearchSchema = z.object({
  query: z.string().trim().default(''),
  'min-view': z.coerce.number().int().positive().optional(),
  'max-view': z.coerce.number().int().positive().optional(),
  'min-page': z.coerce.number().int().positive().optional(),
  'max-page': z.coerce.number().int().positive().optional(),
  from: z.coerce.number().optional(),
  until: z.coerce.number().optional(),
  sort: z.enum(['random', 'id_asc', 'popular']).optional(),
  'after-id': z.string().optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
  category: z.string().optional(),
  view: z.enum(['card', 'img']).optional(),
})

export default async function Page({ searchParams }: BasePageProps) {
  const {
    query,
    from,
    until,
    sort,
    'after-id': afterId,
    'min-view': minView,
    'max-view': maxView,
    'min-page': minPage,
    'max-page': maxPage,
    skip,
    category,
    view = 'card',
  } = SearchSchema.parse({
    ...getJSONCookie(await cookies(), ['view']),
    ...(await searchParams),
  })

  const mangas = await searchMangasFromKHentai({
    search: query,
    minViews: minView,
    maxViews: maxView,
    minPages: minPage,
    maxPages: maxPage,
    startDate: from,
    endDate: until,
    sort: sort,
    nextId: afterId,
    offset: skip,
    categories: category,
  })

  if (!mangas) {
    notFound()
  }

  return (
    <div className="p-2">
      <ul className={`grid ${MANGA_LIST_GRID_COLUMNS[view]} gap-2 grow`}>
        {mangas.map((manga, i) =>
          view === ViewParam.IMAGE ? (
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
    </div>
  )
}
