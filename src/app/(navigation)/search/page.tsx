import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { BasePageProps } from '@/types/nextjs'
import { getJSONCookie } from '@/utils/cookie'
import { ViewCookie } from '@/utils/param'

import SearchResults from './SearchResults'
import { MangaSearchSchema } from './searchValidation'

export default async function Page({ searchParams }: BasePageProps) {
  const cookieStore = await cookies()

  const validationResult = MangaSearchSchema.safeParse({
    ...getJSONCookie(cookieStore, ['view']),
    ...(await searchParams),
  })

  if (!validationResult.success) {
    notFound()
  }

  const {
    view,
    sort,
    'min-view': minView,
    'max-view': maxView,
    'min-page': minPage,
    'max-page': maxPage,
    from,
    to,
    'next-id': nextId,
    skip,
  } = validationResult.data

  const viewType = view === 'img' ? ViewCookie.IMAGE : ViewCookie.CARD
  const hasActiveFilters = Boolean(from ?? to ?? sort ?? nextId ?? minView ?? maxView ?? minPage ?? maxPage ?? skip)

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
            {(from || to) && (
              <span className="ml-2 text-zinc-300">
                (날짜: {from ? new Date(Number(from) * 1000).toLocaleDateString('ko-KR') : '처음'} ~{' '}
                {to ? new Date(Number(to) * 1000).toLocaleDateString('ko-KR') : '끝'})
              </span>
            )}
            {nextId && <span className="ml-2 text-zinc-300">(ID 이후: {nextId})</span>}
            {skip && Number(skip) > 0 && <span className="ml-2 text-zinc-300">(건너뛰기: {skip}개)</span>}
          </p>
        </div>
      )}
      <SearchResults view={viewType} />
    </>
  )
}
