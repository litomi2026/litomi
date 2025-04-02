import BookmarkLink, { BookmarkLinkSkeleton } from '@/components/header/BookmarkLink'
import { Suspense } from '@suspensive/react'

export default async function Page() {
  return (
    <div className="p-4">
      <div>
        <Suspense clientOnly fallback={<BookmarkLinkSkeleton />}>
          <BookmarkLink />
        </Suspense>
        <div></div>
      </div>
    </div>
  )
}
