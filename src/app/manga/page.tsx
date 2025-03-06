import MangaCard from '@/components/MangaCard'
import Navigation from '@/components/Navigation'
import { SHORT_NAME } from '@/constants'
import { mangaIds, mangas } from '@/database/manga'
import { BasePageProps } from '@/types/nextjs'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const MANGA_PER_PAGE = 18

const mangaByPage = Array.from({
  length: Math.ceil(mangaIds.length / MANGA_PER_PAGE),
}).map((_, i) => mangaIds.slice(i * MANGA_PER_PAGE, (i + 1) * MANGA_PER_PAGE))

export default async function Page({ searchParams }: BasePageProps) {
  const { page = '1' } = await searchParams
  const currentPageNumber = Number(page)

  if (
    Array.isArray(page) ||
    isNaN(currentPageNumber) ||
    !isFinite(currentPageNumber) ||
    currentPageNumber < 1 ||
    currentPageNumber > mangaByPage.length
  ) {
    notFound()
  }

  const currentPage = mangaByPage[currentPageNumber - 1]

  return (
    <main className="p-2 min-h-dvh flex flex-col max-w-screen-xl mx-auto">
      <ul className="grid md:grid-cols-2 gap-2 grow pb-safe">
        {currentPage.map((id, i) => (
          <MangaCard index={i} key={id} manga={mangas[id]} />
        ))}
      </ul>
      <div className="flex justify-center overflow-x-auto scrollbar-hidden">
        <Navigation currentPage={currentPageNumber} totalPages={mangaByPage.length} />
      </div>
      <footer className="text-center">
        <p>ⓒ 2025. {SHORT_NAME}. All rights reserved.</p>
        <div className="flex justify-center text-sm py-1">
          <a
            className="flex items-center gap-2 hover:underline"
            href="https://t.me/+Eipy6SJdrx80ODk1"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg className="w-4" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M446.7 98.6l-67.6 318.8c-5.1 22.5-18.4 28.1-37.3 17.5l-103-75.9-49.7 47.8c-5.5 5.5-10.1 10.1-20.7 10.1l7.4-104.9 190.9-172.5c8.3-7.4-1.8-11.5-12.9-4.1L117.8 284 16.2 252.2c-22.1-6.9-22.5-22.1 4.6-32.7L418.2 66.4c18.4-6.9 34.5 4.1 28.5 32.2z"
                fill="currentColor"
              />
            </svg>
            @litomi_official
          </a>
        </div>
        <Link className="hover:underline text-xs" href="/deterrence" target="_blank">
          사용자 연령 제한 규정
        </Link>
      </footer>
    </main>
  )
}
