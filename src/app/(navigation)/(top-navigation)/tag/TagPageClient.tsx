'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import IconSpinner from '@/components/icons/IconSpinner'
import PageNavigation from '@/components/PageNavigation'
import useLocaleFromCookie from '@/hook/useLocaleFromCookie'
import { formatNumber } from '@/utils/format'

import { CategoryParam, useTagQuery } from './hook'

const CATEGORY_PARAMS: CategoryParam[] = ['female', 'male', 'mixed', 'other']

const CATEGORY_LABELS: Record<CategoryParam, string> = {
  female: '여',
  male: '남',
  mixed: '혼합',
  other: '기타',
}

const TAG_COLORS: Record<CategoryParam, string> = {
  female: 'bg-red-900/50 hover:bg-red-800/70',
  male: 'bg-blue-900/50 hover:bg-blue-800/70',
  mixed: 'bg-purple-900/50 hover:bg-purple-800/70',
  other: 'bg-zinc-800/50 hover:bg-zinc-700/70',
}

const TAB_COLORS: Record<CategoryParam, string> = {
  female: 'aria-current:text-red-400 aria-current:border-red-400',
  male: 'aria-current:text-blue-400 aria-current:border-blue-400',
  mixed: 'aria-current:text-purple-400 aria-current:border-purple-400',
  other: 'aria-current:text-zinc-300 aria-current:border-zinc-400',
}

export default function TagPageClient() {
  const searchParams = useSearchParams()
  const locale = useLocaleFromCookie()
  const categoryParam = searchParams.get('category')
  const category = isValidCategory(categoryParam) ? categoryParam : 'female'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const { data, isLoading, isError, isFetching } = useTagQuery({ category, page, locale })

  return (
    <div className="flex flex-col grow gap-6 p-4">
      {/* 카테고리 탭 */}
      <nav className="flex gap-1 justify-center">
        {CATEGORY_PARAMS.map((cat) => (
          <Link
            aria-current={cat === category}
            className={`px-5 py-2.5 text-sm font-medium transition border-b-2 border-transparent text-zinc-400 hover:text-zinc-200 ${TAB_COLORS[cat]}`}
            href={`/tag?category=${cat}`}
            key={cat}
          >
            {CATEGORY_LABELS[cat]}
          </Link>
        ))}
      </nav>

      {/* 태그 개수 정보 */}
      {data && (
        <p className="text-center text-sm text-zinc-400">
          {CATEGORY_LABELS[category]} 태그{' '}
          <span className="tabular-nums">
            {data.pagination.total.toLocaleString()}개 중 {((page - 1) * data.pagination.limit + 1).toLocaleString()}-
            {Math.min(page * data.pagination.limit, data.pagination.total).toLocaleString()}
          </span>
        </p>
      )}

      {/* 초기 로딩 상태 */}
      {isLoading && !data && (
        <div className="flex justify-center items-center py-20">
          <IconSpinner className="size-8 text-zinc-400" />
        </div>
      )}

      {/* 에러 상태 */}
      {isError && !data && (
        <div className="flex justify-center items-center py-20 text-zinc-400">태그를 불러오는 데 실패했어요</div>
      )}

      {/* 태그 목록 */}
      {data && (
        <ul
          aria-busy={isFetching}
          className="flex flex-wrap gap-2 justify-center transition-opacity aria-busy:opacity-50"
        >
          {data.tags.map(({ value, label, count }) => (
            <li key={value}>
              <Link
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition ${TAG_COLORS[category]}`}
                href={`/search?query=${encodeURIComponent(value)}`}
                title={label}
              >
                <span>{label.split(':')[1] || label}</span>
                <span className="tabular-nums text-xs opacity-60">{formatNumber(count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 페이지네이션 */}
      {data && (
        <PageNavigation
          className="mt-auto py-4"
          currentPage={page}
          hrefPrefix={`/tag?category=${category}&page=`}
          totalPages={data.pagination.totalPages}
        />
      )}
    </div>
  )
}

function isValidCategory(value: string | null): value is CategoryParam {
  return CATEGORY_PARAMS.includes(value as CategoryParam)
}
