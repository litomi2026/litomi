import { ErrorBoundary } from '@suspensive/react'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import MangaCard, { MangaCardSkeleton } from '@/components/card/MangaCard'
import { fetchMangaFromHiyobi } from '@/crawler/hiyobi'
import { fetchMangaFromKHentai } from '@/crawler/k-hentai'
import { harpiMangas } from '@/database/harpi'
import { BookmarkSource } from '@/database/schema'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { SourceParam } from '@/utils/param'

export default async function Page() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return (
      <>
        <h2 className="text-center font-bold text-xl text-yellow-300 py-4">
          예시 화면이에요. 로그인 후 이용해주세요 🔖
        </h2>
        <ul className="grid gap-2 md:grid-cols-2">
          <MangaCard manga={harpiMangas[Object.keys(harpiMangas)[0]]} source={SourceParam.HARPI} />
        </ul>
      </>
    )
  }

  const bookmarkRows = await getBookmarkRows(userId)()
  if (bookmarkRows.length === 0) notFound()

  const bookmarkInfo = bookmarkRows.map(({ mangaId, source }) => {
    if (source === BookmarkSource.HARPI) {
      return { manga: harpiMangas[mangaId], source: SourceParam.HARPI }
    }
    if (source === BookmarkSource.HIYOBI) {
      return {
        manga: fetchMangaFromHiyobi({ id: mangaId })
          .then((manga) => manga ?? { id: mangaId, title: '만화 정보가 없어요', images: [] })
          .catch(() => ({ id: mangaId, title: '오류가 발생했어요', images: [] })),
        source: SourceParam.HIYOBI,
      }
    }
    if (source === BookmarkSource.K_HENTAI) {
      return {
        manga: fetchMangaFromKHentai({ id: mangaId })
          .then((manga) => manga ?? { id: mangaId, title: '만화 정보가 없어요', images: [] })
          .catch(() => ({ id: mangaId, title: '오류가 발생했어요', images: [] })),
        source: SourceParam.K_HENTAI,
      }
    }
    return { manga: { id: 0, title: '오류가 발생했어요', images: [] }, source: SourceParam.HITOMI }
  })

  const bookmarkedMangas = await Promise.all(bookmarkInfo.map(({ manga }) => manga))

  return (
    <ul className="grid gap-2 md:grid-cols-2 grow">
      {bookmarkedMangas.map((manga, i) => (
        <ErrorBoundary fallback={<MangaCardSkeleton />} key={manga.id}>
          <MangaCard manga={manga} source={bookmarkInfo[i].source} />
        </ErrorBoundary>
      ))}
    </ul>
  )
}

function getBookmarkRows(userId: string) {
  return unstable_cache(() => selectBookmarks({ userId }), [userId, 'bookmarks'], {
    tags: [`${userId}-bookmarks`],
    revalidate: 15,
  })
}
