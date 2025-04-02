import MangaCard from '@/components/card/MangaCard'
import { fetchMangaFromHiyobi } from '@/crawler/hiyobi'
import { harpiMangas } from '@/database/harpi'
import { hashaMangas } from '@/database/hasha'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return (
      <div className="p-2">
        <h1 className="text-lg font-bold">로그인이 필요해요</h1>
      </div>
    )
  }

  const getBookmarkRows = unstable_cache(() => selectBookmarks({ userId }), [userId, 'bookmarks'], {
    tags: ['bookmarks'],
    revalidate: 3600,
  })

  const bookmarkRows = await getBookmarkRows()

  // NOTE: beta 버전 - 최대 20개
  const bookmarkedMangas = await Promise.all(
    bookmarkRows.slice(0, 20).map(({ mangaId }) => {
      // 1) hashaMangas[mangaId]가 있다면 그대로 반환
      // 2) harpiMangas[mangaId]가 있다면 그대로 반환
      // 3) 둘 다 없다면 fetchMangaFromHiyobi 로 비동기 호출
      // → 위 셋 중 하나가 resolve되어 최종 만화 데이터를 반환
      return hashaMangas[mangaId] ?? harpiMangas[mangaId] ?? fetchMangaFromHiyobi({ id: mangaId })
    }),
  )

  return (
    <main className="grid gap-2 p-2">
      <h1 className="text-lg font-bold text-center">북마크</h1>
      <ul className="grid gap-2 md:grid-cols-2">
        {bookmarkedMangas.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </ul>
    </main>
  )
}
