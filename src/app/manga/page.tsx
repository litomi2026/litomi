import { BasePageProps } from '@/common/type'
import Link from 'next/link'
import mangas from '@/database/manga.json'
import { notFound } from 'next/navigation'
import MangaCard from '@/components/MangaCard'

const mangaIds = Object.keys(mangas).sort((a, b) => +b - +a) as (keyof typeof mangas)[]
const MANGA_PER_PAGE = 18
const VISIBLE_PAGES = 10

const mangaByPage = Array.from({
  length: Math.ceil(mangaIds.length / MANGA_PER_PAGE),
}).map((_, i) => mangaIds.slice(i * MANGA_PER_PAGE, (i + 1) * MANGA_PER_PAGE))

export default async function Page({ searchParams }: BasePageProps) {
  const { page } = await searchParams
  const currentPageNumber = Number(page)

  if (
    !page ||
    Array.isArray(page) ||
    isNaN(currentPageNumber) ||
    !isFinite(currentPageNumber) ||
    currentPageNumber < 1 ||
    currentPageNumber > mangaByPage.length
  ) {
    notFound()
  }

  // 배열은 0-index 기반이므로 현재 페이지는 (currentPageNumber - 1)
  const currentPage = mangaByPage[currentPageNumber - 1]
  const totalPages = mangaByPage.length

  // 페이지 번호 표시 범위
  let startPage = Math.max(1, currentPageNumber - Math.floor(VISIBLE_PAGES / 2))
  let endPage = startPage + VISIBLE_PAGES - 1
  if (endPage > totalPages) {
    endPage = totalPages
    startPage = Math.max(1, endPage - VISIBLE_PAGES + 1)
  }

  return (
    <main className="p-2 max-w-screen-xl mx-auto">
      <ul className="grid md:grid-cols-2 gap-2">
        {currentPage.map((id) => (
          <MangaCard key={id} manga={mangas[id]} />
        ))}
      </ul>
      <nav className="flex justify-center overflow-x-auto">
        <ol className="flex py-2 whitespace-nowrap items-center min-w-0 font-bold text-2xl [&_a]:px-4 [&_a]:py-2 ">
          <li>
            <Link
              aria-disabled={currentPageNumber <= 1}
              href={`/manga?page=${1}`}
              className="aria-disabled:text-gray-400 aria-disabled:pointer-events-none"
            >
              처음
            </Link>
          </li>
          <li>
            <Link
              aria-disabled={currentPageNumber <= 1}
              href={`/manga?page=${currentPageNumber - 1}`}
              className="aria-disabled:text-gray-400 aria-disabled:pointer-events-none"
            >
              {'<'}
            </Link>
          </li>
          {startPage > 1 && (
            <li>
              <Link href={`/manga?page=${Math.max(currentPageNumber - VISIBLE_PAGES, 1)}`}>
                {'<<'}
              </Link>
            </li>
          )}
          {/* 현재 페이지 주변의 번호들 */}
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
            <li key={page}>
              <Link
                aria-selected={page === currentPageNumber}
                className="rounded aria-selected:bg-blue-500 aria-selected:text-white"
                href={`/manga?page=${page}`}
              >
                {page}
              </Link>
            </li>
          ))}
          {endPage < totalPages && (
            <li>
              <Link href={`/manga?page=${Math.min(currentPageNumber + VISIBLE_PAGES, totalPages)}`}>
                {'>>'}
              </Link>
            </li>
          )}
          <li>
            <Link
              aria-disabled={currentPageNumber >= totalPages}
              href={`/manga?page=${currentPageNumber + 1}`}
              className="aria-disabled:text-gray-400 aria-disabled:pointer-events-none"
            >
              {'>'}
            </Link>
          </li>
          <li>
            <Link
              aria-disabled={currentPageNumber >= totalPages}
              href={`/manga?page=${totalPages}`}
              className="aria-disabled:text-gray-400 aria-disabled:pointer-events-none"
            >
              끝
            </Link>
          </li>
        </ol>
      </nav>

      <footer className="text-center">
        <p>© 2025 ~</p>
      </footer>
    </main>
  )
}
