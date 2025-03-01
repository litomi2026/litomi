import MangaCard from '@/components/MangaCard'
import Navigation from '@/components/Navigation'
import { mangaIds, mangas } from '@/database/manga'
import { BasePageProps } from '@/types/nextjs'
import { notFound } from 'next/navigation'

const MANGA_PER_PAGE = 18

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

  const currentPage = mangaByPage[currentPageNumber - 1]

  return (
    <main className="p-2 max-w-screen-xl mx-auto">
      <ul className="grid md:grid-cols-2 gap-2">
        {currentPage.map((id) => (
          <MangaCard key={id} manga={mangas[id]} />
        ))}
      </ul>
      <div className="flex justify-center overflow-x-auto">
        <Navigation currentPage={currentPageNumber} totalPages={mangaByPage.length} />
      </div>
      <footer className="text-center">
        <p>© 2025 ~</p>
      </footer>
    </main>
  )
}
