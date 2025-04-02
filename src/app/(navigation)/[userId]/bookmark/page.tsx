import MangaCard from '@/components/card/MangaCard'
import IconInfo from '@/components/icons/IconInfo'
import Tooltip from '@/components/ui/Tooltip'
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
      <div className="flex items-center justify-center">
        <BookmarkTooltip />
      </div>
      <ul className="grid gap-2 md:grid-cols-2">
        {!hasBookmarks && <MangaCard manga={hashaMangas['3023700']} />}
        {bookmarkedMangas.filter(checkDefined).map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </ul>
    </main>
  )
}

function BookmarkTooltip() {
  return (
    <Tooltip position="bottom">
      <div className="flex items-center gap-1">
        <p className="text-xs md:text-sm">북마크 반영이 안 돼요!</p>
        <IconInfo className="w-3 md:w-4" />
      </div>
      <div className="rounded-xl border-2 border-zinc-700 bg-background min-w-3xs p-3 text-sm">
        <p>
          클라우드 비용 절감을 위해 서버 트래픽을 제한하고 있어서 실시간 반영이 어려워요. 변경 사항이 실제로 반영될
          때까지 최대 1시간 정도 걸릴 수 있어요
        </p>
      </div>
    </Tooltip>
  )
}
