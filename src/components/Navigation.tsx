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
    <nav className="flex gap-1 py-2 whitespace-nowrap items-center min-w-0 font-bold text-2xl [&_a]:aria-disabled:text-gray-600 [&_a]:aria-disabled:pointer-events-none [&_a]:px-3 [&_a]:py-1 [&_a]:h-full [&_svg]:h-full">
      {currentPage > 1 && (
        <Link href={`/manga?page=${1}`}>
          <IconFirstPage className="w-6" />
        </Link>
      )}
      {startPage > 1 && (
        <Link href={`/manga?page=${Math.max(currentPage - VISIBLE_PAGES, 1)}`}>
          <IconJumpPrev className="w-6" />
        </Link>
      )}
      <Link aria-disabled={currentPage <= 1} href={`/manga?page=${currentPage - 1}`}>
        <IconPrevPage className="w-6" />
      </Link>
      {/* 현재 페이지 주변의 번호들 */}
      {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
        <Link
          aria-selected={page === currentPage}
          className="rounded-full hover: aria-selected:bg-blue-500 aria-selected:text-white"
          href={`/manga?page=${page}`}
          key={page}
        >
          {page}
        </Link>
      ))}
      <Link aria-disabled={currentPage >= totalPages} href={`/manga?page=${currentPage + 1}`}>
        <IconNextPage className="w-6" />
      </Link>
      {endPage < totalPages && (
        <Link href={`/manga?page=${Math.min(currentPage + VISIBLE_PAGES, totalPages)}`}>
          <IconJumpNext className="w-6" />
        </Link>
      )}
      {currentPage < totalPages && (
        <Link aria-disabled={currentPage >= totalPages} href={`/manga?page=${totalPages}`}>
          <IconLastPage className="w-6" />
        </Link>
      )}
    </nav>
  )
}
