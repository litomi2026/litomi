import Link from 'next/link'

import { IconFirstPage, IconJumpNext, IconJumpPrev, IconLastPage, IconNextPage, IconPrevPage } from './icons/IconArrows'
import NavigationJump from './NavigationJump'

const VISIBLE_PAGES = 9

type Props = {
  currentPage: number
  totalPages: number
  hrefPrefix?: string
  hrefSuffix?: string
}

export default function Navigation({ currentPage, totalPages, hrefPrefix = '', hrefSuffix = '' }: Props) {
  let startPage = Math.max(1, currentPage - Math.floor(VISIBLE_PAGES / 2))
  let endPage = startPage + VISIBLE_PAGES - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(1, endPage - VISIBLE_PAGES + 1)
  }

  const visiblePageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <nav
      className="flex gap-2 py-2 items-stretch min-w-0 font-bold tabular-nums [&_a]:items-center [&_a]:text-center [&_span]:px-2 [&_a]:aria-current:bg-brand-gradient [&_a]:aria-current:pointer-events-none [&_a]:aria-current:text-background [&_a]:aria-disabled:text-zinc-600 [&_a]:aria-disabled:pointer-events-none [&_a]:hover:bg-zinc-700 [&_a]:active:bg-zinc-800 [&_a]:rounded-full
      text-lg [&_span]:min-w-10 [&_svg]:w-6 [&_svg]:m-2
      md:text-xl [&_span]:md:min-w-11 [&_svg]:md:w-7
      "
    >
      {currentPage > 1 && (
        <Link aria-label="첫 페이지" className="hidden sm:block" href={`${hrefPrefix}${1}${hrefSuffix}`}>
          <IconFirstPage />
        </Link>
      )}
      {startPage > 1 && (
        <Link
          aria-label={`이전 ${VISIBLE_PAGES} 페이지`}
          href={`${hrefPrefix}${Math.max(1, currentPage - VISIBLE_PAGES)}${hrefSuffix}`}
        >
          <IconJumpPrev />
        </Link>
      )}
      <Link
        aria-disabled={currentPage <= 1}
        aria-label="이전 페이지"
        href={`${hrefPrefix}${Math.max(1, currentPage - 1)}${hrefSuffix}`}
      >
        <IconPrevPage />
      </Link>
      {/* 현재 페이지 주변의 번호들 */}
      {visiblePageNumbers.map((page) => (
        <a aria-current={page === currentPage} className="flex" href={`${hrefPrefix}${page}${hrefSuffix}`} key={page}>
          <span>{page}</span>
        </a>
      ))}
      <Link
        aria-disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
        href={`${hrefPrefix}${Math.min(currentPage + 1, totalPages)}${hrefSuffix}`}
      >
        <IconNextPage />
      </Link>
      {endPage < totalPages && (
        <Link
          aria-label={`다음 ${VISIBLE_PAGES} 페이지 `}
          href={`${hrefPrefix}${Math.min(currentPage + VISIBLE_PAGES, totalPages)}${hrefSuffix}`}
        >
          <IconJumpNext />
        </Link>
      )}
      {currentPage < totalPages && (
        <Link
          aria-disabled={currentPage >= totalPages}
          aria-label="마지막 페이지"
          className="hidden sm:block"
          href={`${hrefPrefix}${totalPages}${hrefSuffix}`}
        >
          <IconLastPage />
        </Link>
      )}
      <NavigationJump totalPages={totalPages} />
    </nav>
  )
}
