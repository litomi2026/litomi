import Link from 'next/link'

import { IconFirstPage, IconJumpNext, IconJumpPrev, IconLastPage, IconNextPage, IconPrevPage } from './icons/IconArrows'
import NavigationJump from './NavigationJump'

const VISIBLE_PAGES = 9

type Props = {
  className?: string
  currentPage: number
  totalPages: number
  hrefPrefix?: string
  hrefSuffix?: string
}

export default function Navigation({
  className = '',
  currentPage,
  totalPages,
  hrefPrefix = '',
  hrefSuffix = '',
}: Props) {
  let startPage = Math.max(1, currentPage - Math.floor(VISIBLE_PAGES / 2))
  let endPage = startPage + VISIBLE_PAGES - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(1, endPage - VISIBLE_PAGES + 1)
  }

  const visiblePageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <nav
      className={`flex flex-wrap justify-center items-center gap-2 w-fit mx-auto py-2 font-bold tabular-nums text-lg 
        [&_a]:flex [&_a]:justify-center [&_a]:items-center [&_a]:rounded-full [&_a]:aspect-square [&_a]:w-10 [&_svg]:w-6
        [&_a]:aria-current:bg-brand-gradient [&_a]:aria-current:pointer-events-none [&_a]:aria-current:text-background 
        [&_a]:aria-disabled:pointer-events-none  [&_a]:aria-disabled:text-zinc-600 [&_a]:hover:bg-zinc-700 [&_a]:active:bg-zinc-800 
        md:text-xl md:[&_a]:w-11 md:[&_svg]:w-7 ${className}`}
    >
      {currentPage > 1 && (
        <Link aria-label="첫 페이지" className="hidden sm:flex" href={`${hrefPrefix}${1}${hrefSuffix}`}>
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
        <a aria-current={page === currentPage} href={`${hrefPrefix}${page}${hrefSuffix}`} key={page}>
          <span>{page}</span>
        </a>
      ))}
      <div className="flex gap-2">
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
            className="hidden sm:flex"
            href={`${hrefPrefix}${totalPages}${hrefSuffix}`}
          >
            <IconLastPage />
          </Link>
        )}
        <NavigationJump hrefPrefix={hrefPrefix} hrefSuffix={hrefSuffix} totalPages={totalPages} />
      </div>
    </nav>
  )
}
