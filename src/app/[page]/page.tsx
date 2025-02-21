import { BasePageProps } from '@/common/type'
import CoverImageViewer from '@/components/CoverImageViewer'
import Link from 'next/link'
import mangas from '@/database/manga.json'
import { notFound } from 'next/navigation'
import dayjs from 'dayjs'
import { BASE_URL } from '@/common/constant'

const mangaIds = Object.keys(mangas).sort((a, b) => +b - +a) as (keyof typeof mangas)[]

const MANGA_PER_PAGE = 18

const mangaByPage = Array.from({
  length: Math.ceil(mangaIds.length / MANGA_PER_PAGE),
}).map((_, i) => mangaIds.slice(i * MANGA_PER_PAGE, (i + 1) * MANGA_PER_PAGE))

export default async function Page(props: BasePageProps) {
  const params = await props.params
  const page = +params.page

  if (isNaN(page) || isFinite(page) === false || page < 1 || page > mangaByPage.length) {
    notFound()
  }

  const currentPage = mangaByPage[page]

  return (
    <main className="p-2 max-w-screen-xl mx-auto">
      <ul className="grid lg:grid-cols-2 xl:grid-cols-3 gap-2">
        {currentPage.map((id) => {
          const { artists, characters, date, group, related, series, tags, title, type, images } =
            mangas[id]
          return (
            <li key={id} className="grid grid-cols-2 border border-gray-200 dark:border-gray-700">
              <Link href={`/${page}/${id}`} target="_blank">
                <CoverImageViewer src={`${BASE_URL}/${id}/${images[0].name}`} />
              </Link>
              <div className="flex flex-col justify-between p-1 gap-1">
                <div className="flex flex-col gap-2">
                  <h4 className="line-clamp-3 sm:line-clamp-none lg:line-clamp-4 xl:line-clamp-3 leading-5 min-w-0">
                    {title}
                  </h4>
                  <div className="text-sm">종류 {type}</div>
                  {artists.length > 0 && (
                    <div className="text-sm line-clamp-1">작가 {artists.join(', ')}</div>
                  )}
                  {group.length > 0 && (
                    <div className="text-sm line-clamp-1">그룹 {group.join(', ')}</div>
                  )}
                  {series.length > 0 && (
                    <div className="text-sm line-clamp-1">시리즈 {series.join(', ')}</div>
                  )}
                  {characters.length > 0 && (
                    <div className="text-sm line-clamp-1">캐릭터 {characters.join(', ')}</div>
                  )}
                  {related.length > 0 && (
                    <div className="text-sm flex gap-2 whitespace-nowrap">
                      연관
                      <ul className="flex sm:flex-wrap lg:flex-nowrap overflow-auto gap-1">
                        {related.map((id) => (
                          <li key={id} className="rounded px-1 text-white bg-stone-500">
                            <Link href={`/${page}/${id}`}>{id}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="text-sm flex gap-2 whitespace-nowrap">
                      태그
                      <ul className="flex sm:flex-wrap lg:flex-nowrap overflow-auto gap-1">
                        {tags.map((tag) => {
                          const a = tag.split(':')
                          const backgroundColor =
                            {
                              male: 'bg-blue-500',
                              female: 'bg-red-500',
                            }[a[0]] ?? 'bg-gray-500'
                          return (
                            <li key={tag} className={`rounded px-1 text-white ${backgroundColor}`}>
                              {a[a.length - 1]}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex text-xs justify-between  items-center">
                  <Link
                    href={`/${page}/${id}`}
                    className="text-gray-500 focus:underline hover:underline"
                  >
                    {id} {images.length}장
                  </Link>
                  <div className="text-right text-gray-500"></div>
                  <div className="text-right text-gray-500">
                    {dayjs(date).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <nav className="flex justify-center overflow-x-auto">
        <ol className="flex min-w-0 font-bold py-4 text-2xl [&_a]:p-4">
          <li>
            <Link href="/1">1</Link>
          </li>
          <li>
            <Link href="/2">2</Link>
          </li>
          <li>
            <Link href="/3">3</Link>
          </li>
          <li>
            <Link href="/4">4</Link>
          </li>
          <li>
            <Link href="/5">5</Link>
          </li>
          <li>
            <Link href="/6">6</Link>
          </li>
          <li>
            <Link href="/7">7</Link>
          </li>
          <li>
            <Link href="/8">8</Link>
          </li>
          <li>
            <Link href="/9">9</Link>
          </li>
          <li>
            <Link href="/10">10</Link>
          </li>
        </ol>
      </nav>

      <footer className="text-center">
        <p>© 2025 ~</p>
      </footer>
    </main>
  )
}
