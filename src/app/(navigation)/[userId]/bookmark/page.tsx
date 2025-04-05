import MangaCard from '@/components/card/MangaCard'
import { fetchMangaFromHiyobi } from '@/crawler/hiyobi'
import { harpiMangas } from '@/database/harpi'
import { hashaMangas } from '@/database/hasha'
import selectBookmarks from '@/sql/selectBookmarks'
import { getUserIdFromAccessToken } from '@/utils/cookie'
import { checkDefined } from '@/utils/type'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

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
          <MangaCard manga={hashaMangas['3023700']} source="ha" />
        </ul>
      </>
    )
  }

  const getBookmarkRows = unstable_cache(() => selectBookmarks({ userId }), [userId, 'bookmarks'], {
    tags: [`${userId}-bookmarks`],
    revalidate: 60,
  })

  const bookmarkRows = await getBookmarkRows()
  const sources: string[] = []

  if (bookmarkRows.length === 0) {
    notFound()
  }

  // NOTE: beta 버전 - 최대 20개
  // 1) hashaMangas[mangaId]가 있다면 그대로 반환
  // 2) harpiMangas[mangaId]가 있다면 그대로 반환
  // 3) 둘 다 없다면 fetchMangaFromHiyobi 로 비동기 호출
  // 4) 모든 소스가 실패하면 null을 반환
  const bookmarkedMangas = await Promise.all(
    bookmarkRows.slice(0, 20).map(({ mangaId }) => {
      if (hashaMangas[mangaId]) {
        sources.push('ha')
        return hashaMangas[mangaId]
      }
      if (harpiMangas[mangaId]) {
        sources.push('hp')
        return harpiMangas[mangaId]
      }
      return fetchMangaFromHiyobi({ id: mangaId })
        .then((manga) => {
          sources.push('hi')
          return manga ?? { id: mangaId, title: '만화 정보가 없어요', images: [] }
        })
        .catch(() => ({ id: mangaId, title: '오류가 발생했어요', images: [] }))
    }),
  )

  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {bookmarkedMangas.filter(checkDefined).map((manga, i) => (
        <MangaCard key={manga.id} manga={manga} source={sources[i]} />
      ))}
    </ul>
  )
}
