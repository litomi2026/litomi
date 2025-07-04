import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import MangaCard from '@/components/card/MangaCard'
import MangaCardImage from '@/components/card/MangaCardImage'
import { searchMangasFromKHentai } from '@/crawler/k-hentai'
import { BasePageProps } from '@/types/nextjs'
import { getJSONCookie } from '@/utils/cookie'
import { getViewerLink } from '@/utils/manga'
import { SourceParam, ViewCookie } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

const SearchSchema = z.object({
  query: z.string().trim().optional(),
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
    view = 'card',
  } = SearchSchema.parse({
    ...getJSONCookie(await cookies(), ['view']),
    ...(await searchParams),
  })

  const mangas = await searchMangasFromKHentai({
    query,
    minViews: minView,
    maxViews: maxView,
    minPages: minPage,
    maxPages: maxPage,
    startDate: from,
    endDate: until,
    sort: sort,
    nextId: afterId,
    offset: skip,
  })

  if (!mangas) {
    notFound()
  }

  const hasActiveFilters = !!(
    query ||
    from ||
    until ||
    sort ||
    afterId ||
    minView ||
    maxView ||
    minPage ||
    maxPage ||
    skip
  )

  return (
    <>
      {hasActiveFilters && (
        <div className="mb-2 p-2 bg-zinc-900 border border-zinc-700 rounded-lg">
          <p className="text-sm text-zinc-400 break-words">
            <span className="whitespace-nowrap">검색 결과</span>
            {query && <span className="ml-2 text-zinc-200">&ldquo;{query}&rdquo;</span>}
            {sort && (
              <span className="ml-2 text-zinc-300">
                (정렬: {sort === 'popular' ? '인기순' : sort === 'id_asc' ? '오래된 순' : '랜덤'})
              </span>
            )}
            {(minView || maxView) && (
              <span className="ml-2 text-zinc-300">
                (조회수: {minView || '0'} ~ {maxView || '∞'})
              </span>
            )}
            {(minPage || maxPage) && (
              <span className="ml-2 text-zinc-300">
                (페이지: {minPage || '0'} ~ {maxPage || '∞'})
              </span>
            )}
            {(from || until) && (
              <span className="ml-2 text-zinc-300">
                (날짜: {from ? new Date(from).toLocaleDateString('ko-KR') : '처음'} ~{' '}
                {until ? new Date(until).toLocaleDateString('ko-KR') : '끝'})
              </span>
            )}
            {skip && Number(skip) > 0 && <span className="ml-2 text-zinc-300">(건너뛰기: {skip}개)</span>}
            {afterId && <span className="ml-2 text-zinc-300">(ID 이후: {afterId})</span>}
          </p>
        </div>
      )}

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
    </>
  )
}
