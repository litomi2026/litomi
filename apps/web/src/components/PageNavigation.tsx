import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'

import LinkPending from './LinkPending'
import NavigationJump from './NavigationJump'

const VISIBLE_PAGES = 9

type Props = {
  className?: string
  currentPage: number
  totalPages: number
  hrefPrefix?: string
  hrefSuffix?: string
}

export default function PageNavigation({
  className = '',
  currentPage,
  totalPages,
  hrefPrefix = '',
  hrefSuffix = '',
}: Props) {
  const { startPage, endPage, visiblePageNumbers } = getVisiblePageRange(currentPage, totalPages, VISIBLE_PAGES)

  const commonClassName =
    'justify-center items-center rounded-full px-2 min-w-10 h-10 aria-current:bg-brand-gradient aria-current:pointer-events-none aria-current:text-background aria-disabled:pointer-events-none aria-disabled:text-zinc-600 hover:bg-zinc-700 active:bg-zinc-800'

  return (
    <nav
      className={`flex flex-wrap justify-center items-center gap-2 w-fit mx-auto font-bold tabular-nums text-lg md:text-xl ${className}`}
    >
      {currentPage > VISIBLE_PAGES / 2 && (
        <Link
          aria-label="첫 페이지"
          className={`hidden sm:flex ${commonClassName}`}
          href={`${hrefPrefix}${1}${hrefSuffix}`}
          prefetch={false}
        >
          <LinkPending className="size-5">
            <ChevronFirst />
          </LinkPending>
        </Link>
      )}
      {startPage > 1 && (
        <Link
          aria-label={`이전 ${VISIBLE_PAGES} 페이지`}
          className={`flex ${commonClassName}`}
          href={`${hrefPrefix}${Math.max(1, currentPage - VISIBLE_PAGES)}${hrefSuffix}`}
          prefetch={false}
        >
          <LinkPending className="size-5">
            <ChevronsLeft />
          </LinkPending>
        </Link>
      )}
      <Link
        aria-disabled={currentPage <= 1}
        aria-label="이전 페이지"
        className={`flex ${commonClassName}`}
        href={`${hrefPrefix}${Math.max(1, currentPage - 1)}${hrefSuffix}`}
        prefetch={false}
      >
        <LinkPending className="size-5">
          <ChevronLeft />
        </LinkPending>
      </Link>
      {/* 현재 페이지 주변의 번호들 */}
      {visiblePageNumbers.map((page) => (
        <Link
          aria-current={page === currentPage}
          className={`flex ${commonClassName}`}
          href={`${hrefPrefix}${page}${hrefSuffix}`}
          key={page}
          prefetch={false}
        >
          <LinkPending className="size-5">{page}</LinkPending>
        </Link>
      ))}
      <div className="flex gap-2">
        <Link
          aria-disabled={currentPage >= totalPages}
          aria-label="다음 페이지"
          className={`flex ${commonClassName}`}
          href={`${hrefPrefix}${Math.min(currentPage + 1, totalPages)}${hrefSuffix}`}
          prefetch={false}
        >
          <LinkPending className="size-5">
            <ChevronRight />
          </LinkPending>
        </Link>
        {endPage < totalPages && (
          <Link
            aria-label={`다음 ${VISIBLE_PAGES} 페이지 `}
            className={`flex ${commonClassName}`}
            href={`${hrefPrefix}${Math.min(currentPage + VISIBLE_PAGES, totalPages)}${hrefSuffix}`}
            prefetch={false}
          >
            <LinkPending className="size-5">
              <ChevronsRight />
            </LinkPending>
          </Link>
        )}
        {currentPage < totalPages && (
          <Link
            aria-disabled={currentPage >= totalPages}
            aria-label="마지막 페이지"
            className={`hidden sm:flex ${commonClassName}`}
            href={`${hrefPrefix}${totalPages}${hrefSuffix}`}
            prefetch={false}
          >
            <LinkPending className="size-5">
              <ChevronLast />
            </LinkPending>
          </Link>
        )}
        {totalPages > VISIBLE_PAGES * 2 && (
          <NavigationJump hrefPrefix={hrefPrefix} hrefSuffix={hrefSuffix} totalPages={totalPages} />
        )}
      </div>
    </nav>
  )
}

function getVisiblePageRange(currentPage: number, totalPages: number, visiblePages: number) {
  if (totalPages <= 0) {
    return { startPage: 0, endPage: 0, visiblePageNumbers: [] }
  }

  const half = Math.floor(visiblePages / 2)
  const startPage = Math.max(1, Math.min(currentPage - half, totalPages - visiblePages + 1))
  const endPage = Math.min(totalPages, startPage + visiblePages - 1)
  const visiblePageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  return { startPage, endPage, visiblePageNumbers }
}
