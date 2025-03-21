import Link from 'next/link'

import { IconFirstPage, IconJumpNext, IconJumpPrev, IconLastPage, IconNextPage, IconPrevPage } from './icons/IconArrows'
import NavigationJump from './NavigationJump'

const VISIBLE_PAGES = 9

type Props = {
  currentPage: number
  totalPages: number
}

export default function Navigation({ currentPage, totalPages }: Props) {
  let startPage = Math.max(1, currentPage - Math.floor(VISIBLE_PAGES / 2))
  let endPage = startPage + VISIBLE_PAGES - 1

  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(1, endPage - VISIBLE_PAGES + 1)
  }

  const visiblePageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return (
    <nav
      className="flex gap-2 py-2 items-stretch min-w-0 font-bold tabular-nums [&_a]:items-center [&_a]:text-center [&_span]:px-2 [&_a]:aria-selected:bg-brand-gradient [&_a]:aria-selected:pointer-events-none [&_a]:aria-selected:text-background [&_a]:aria-disabled:text-zinc-600 [&_a]:aria-disabled:pointer-events-none [&_a]:hover:bg-zinc-700 [&_a]:active:bg-zinc-800 [&_a]:rounded-full
      text-lg [&_span]:min-w-10 [&_svg]:w-6 [&_svg]:m-2
      md:text-xl [&_span]:md:min-w-11 [&_svg]:md:w-7
      "
    >
      {currentPage > 1 && (
        <Link className="hidden sm:block" href={`${1}`}>
          <IconFirstPage />
        </Link>
      )}
      {startPage > 1 && (
        <Link href={`${Math.max(1, currentPage - VISIBLE_PAGES)}`}>
          <IconJumpPrev />
        </Link>
      )}
      <Link aria-disabled={currentPage <= 1} href={`${Math.max(1, currentPage - 1)}`}>
        <IconPrevPage />
      </Link>
      {/* 현재 페이지 주변의 번호들 */}
      {visiblePageNumbers.map((page) => (
        <Link aria-selected={page === currentPage} className="flex" href={`${page}`} key={page}>
          <span>{page}</span>
        </Link>
      ))}
      <Link aria-disabled={currentPage >= totalPages} href={`${Math.min(currentPage + 1, totalPages)}`}>
        <IconNextPage />
      </Link>
      {endPage < totalPages && (
        <Link href={`${Math.min(currentPage + VISIBLE_PAGES, totalPages)}`}>
          <IconJumpNext />
        </Link>
      )}
      {currentPage < totalPages && (
        <Link aria-disabled={currentPage >= totalPages} className="hidden sm:block" href={`${totalPages}`}>
          <IconLastPage />
        </Link>
      )}
      <NavigationJump totalPages={totalPages} />
    </nav>
  )
}
