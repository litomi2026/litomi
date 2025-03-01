import Link from 'next/link'

import IconArrow from './icons/IconArrow'
import { IconFirstPage, IconJumpNext, IconJumpPrev, IconLastPage, IconNextPage, IconPrevPage } from './icons/IconArrows'

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
      className="flex gap-2 py-2 items-stretch min-w-0 font-bold tabular-nums [&_a]:items-center [&_a]:text-center [&_span]:px-2 [&_a]:aria-selected:bg-blue-500 [&_a]:aria-selected:pointer-events-none [&_a]:aria-selected:text-white [&_a]:aria-disabled:text-gray-600 [&_a]:aria-disabled:pointer-events-none [&_a]:hover:bg-gray-700 [&_a]:active:bg-gray-800 [&_a]:rounded-full
      text-lg [&_span]:min-w-10 [&_svg]:w-6 [&_svg]:m-2
      md:text-xl [&_span]:md:min-w-11 [&_svg]:md:w-7
      "
    >
      {currentPage > 1 && (
        <Link className="hidden sm:block" href={`/manga?page=${1}`}>
          <IconFirstPage />
        </Link>
      )}
      {startPage > 1 && (
        <Link href={`/manga?page=${Math.max(currentPage - VISIBLE_PAGES, 1)}`}>
          <IconJumpPrev />
        </Link>
      )}
      <Link aria-disabled={currentPage <= 1} href={`/manga?page=${currentPage - 1}`}>
        <IconPrevPage />
      </Link>
      {/* 현재 페이지 주변의 번호들 */}
      {visiblePageNumbers.map((page) => (
        <Link aria-selected={page === currentPage} className="flex" href={`/manga?page=${page}`} key={page}>
          <span>{page}</span>
        </Link>
      ))}
      <Link aria-disabled={currentPage >= totalPages} href={`/manga?page=${currentPage + 1}`}>
        <IconNextPage />
      </Link>
      {endPage < totalPages && (
        <Link href={`/manga?page=${Math.min(currentPage + VISIBLE_PAGES, totalPages)}`}>
          <IconJumpNext />
        </Link>
      )}
      {currentPage < totalPages && (
        <Link aria-disabled={currentPage >= totalPages} className="hidden sm:block" href={`/manga?page=${totalPages}`}>
          <IconLastPage />
        </Link>
      )}
      <form action="/manga" className="flex gap-2 relative sm:hidden" method="get">
        <label className="sr-only" htmlFor="page-input">
          이동할 페이지 번호
        </label>
        <input
          className="w-14 p-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
          id="page-input"
          max={totalPages}
          min="1"
          name="page"
          placeholder={`${currentPage}`}
          required
          type="number"
        />
        <button
          className="whitespace-nowrap bg-gray-800 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
          type="submit"
        >
          <IconArrow />
        </button>
      </form>
    </nav>
  )
}
