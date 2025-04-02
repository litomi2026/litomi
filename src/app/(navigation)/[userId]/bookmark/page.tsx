import MangaCard from '@/components/card/MangaCard'
import { fetchMangaFromHiyobi } from '@/crawler/hiyobi'
import { harpiMangas } from '@/database/harpi'
import { hashaMangas } from '@/database/hasha'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { checkDefined } from '@/utils/type'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return (
      <main className="grid gap-2 p-2">
        <h1 className="text-lg font-bold text-center">북마크 (예시)</h1>
        <h2 className="font-bold text-center">로그인이 필요해요</h2>
        <ul className="grid gap-2 md:grid-cols-2">
          <MangaCard manga={hashaMangas['3023700']} />
        </ul>
      </main>
    )
  }

  const getBookmarkRows = unstable_cache(() => selectBookmarks({ userId }), [userId, 'bookmarks'], {
    tags: ['bookmarks'],
    revalidate: 3600,
  })

  const bookmarkRows = await getBookmarkRows()

  const bookmarkedMangas = await Promise.all(
    // NOTE: beta 버전 - 최대 20개
    bookmarkRows.slice(0, 20).map(({ mangaId }) => {
      // 1) hashaMangas[mangaId]가 있다면 그대로 반환
      // 2) harpiMangas[mangaId]가 있다면 그대로 반환
      // 3) 둘 다 없다면 fetchMangaFromHiyobi 로 비동기 호출
      // 4) 모든 소스가 실패하면 null을 반환
      try {
        return hashaMangas[mangaId] ?? harpiMangas[mangaId] ?? fetchMangaFromHiyobi({ id: mangaId })
      } catch {
        return null
      }
    }),
  )

  const hasBookmarks = bookmarkedMangas.length > 0

  return (
    <main className="grid gap-2 p-2">
      <h1 className="text-lg font-bold text-center">북마크 {!hasBookmarks && '(예시)'}</h1>
      <ul className="grid gap-2 md:grid-cols-2">
        {!hasBookmarks && <MangaCard manga={hashaMangas['3023700']} />}
        {bookmarkedMangas.filter(checkDefined).map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </ul>
    </main>
  )
}
