import Link from 'next/link'

import { IconFirstPage, IconJumpNext, IconJumpPrev, IconLastPage, IconNextPage, IconPrevPage } from './icons/IconArrow'

const VISIBLE_PAGES = 10

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

  return (
    <nav
      className="flex gap-2 py-2 whitespace-nowrap items-stretch min-w-0 font-bold text-2xl transition tabular-nums
      [&_a]:aria-selected:bg-blue-500 [&_a]:aria-selected:!text-white [&_a]:aria-disabled:text-gray-600 [&_a]:aria-disabled:pointer-events-none [&_a]:h-full [&_a]:hover:bg-gray-700 [&_a]:active:bg-gray-800 [&_a]:rounded-full 
      [&_svg]:w-8 [&_svg]:m-1"
    >
      {currentPage > 1 && (
        <Link href={`/manga?page=${1}`}>
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
      {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
        <Link
          aria-disabled={page === currentPage}
          aria-selected={page === currentPage}
          className="px-3 py-1"
          href={`/manga?page=${page}`}
          key={page}
        >
          {page}
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
        <Link aria-disabled={currentPage >= totalPages} href={`/manga?page=${totalPages}`}>
          <IconLastPage />
        </Link>
      )}
    </nav>
  )
}
