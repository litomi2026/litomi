import MangaCard from '@/components/card/MangaCard'
import { hashaMangaIdsDesc, hashaMangas } from '@/database/hasha'
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

  const getBookmarks = unstable_cache(() => selectBookmarks({ userId }), [userId, 'bookmarks'], {
    tags: ['bookmarks'],
    revalidate: 3600,
  })

  const bookmarkIds = await getBookmarks()

  return (
    <div className="p-2">
      <h1 className="text-lg font-bold">준비 중입니다</h1>
      <ul className="grid gap-2 md:grid-cols-2">
        {hashaMangaIdsDesc.slice(0, 1).map((id) => (
          <MangaCard key={id} manga={hashaMangas[id]} />
        ))}
      </ul>
    </div>
  )
}
