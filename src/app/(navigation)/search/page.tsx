import { cookies } from 'next/headers'
import { z } from 'zod'

import { BasePageProps } from '@/types/nextjs'
import { getJSONCookie } from '@/utils/cookie'
import { ViewCookie } from '@/utils/param'

import SearchResults from './SearchResults'

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
  view: z.enum(['img', 'card']).default('card'),
})

export default async function Page({ searchParams }: BasePageProps) {
  const cookieStore = await cookies()

  const {
    from,
    until,
    sort,
    'after-id': afterId,
    'min-view': minView,
    'max-view': maxView,
    'min-page': minPage,
    'max-page': maxPage,
    skip,
    view,
  } = SearchSchema.parse({
    ...getJSONCookie(cookieStore, ['view']),
    ...(await searchParams),
  })

  const hasActiveFilters = Boolean(from ?? until ?? sort ?? afterId ?? minView ?? maxView ?? minPage ?? maxPage ?? skip)

  return (
    <>
      {hasActiveFilters && (
        <div className="mb-2 p-2 bg-zinc-900 border border-zinc-700 rounded-lg">
          <p className="text-sm text-zinc-400 break-words">
            <span className="whitespace-nowrap">적용된 필터</span>
            {sort && (
              <span className="ml-2 text-zinc-300">
                (정렬: {sort === 'popular' ? '인기순' : sort === 'id_asc' ? '오래된 순' : '랜덤'})
              </span>
            )}
            {(minView || maxView) && (
              <span className="ml-2 text-zinc-300">
                (조회수: {minView ?? '0'} ~ {maxView ?? '∞'})
              </span>
            )}
            {(minPage || maxPage) && (
              <span className="ml-2 text-zinc-300">
                (페이지: {minPage ?? '0'} ~ {maxPage ?? '∞'})
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
      <SearchResults view={view as ViewCookie} />
    </>
  )
}
