import type { BasePageProps } from '@/types/nextjs'

import BookmarkLink, { BookmarkLinkSkeleton } from '@/components/header/BookmarkLink'
import LogoutButton from '@/components/header/LogoutButton'
import { getUserId } from '@/utils/param'
import { ErrorBoundary, Suspense } from '@suspensive/react'

export default async function Page({ params }: BasePageProps) {
  const { userId } = await params

  return (
    <div className="p-4 ">
      <LogoutButton />
      <pre>{getUserId(userId)}</pre>
      <ErrorBoundary fallback={BookmarkLinkSkeleton}>
        <Suspense clientOnly fallback={<BookmarkLinkSkeleton />}>
          <BookmarkLink />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
