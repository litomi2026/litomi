import type { BaseLayoutProps } from '@/types/nextjs'

import BookmarkImportButton, { BookmarkImportButtonSkeleton } from '@/components/BookmarkImportButton'
import { ErrorBoundary, Suspense } from '@suspensive/react'

import BookmarkTooltip from './BookmarkTooltip'
import RefreshButton from './RefreshButton'

export default async function Layout({ children }: BaseLayoutProps) {
  return (
    <main className="flex flex-col gap-2 p-2 h-full">
      <div className="flex justify-center items-center gap-x-4 flex-wrap">
        <ErrorBoundary fallback={BookmarkImportButtonSkeleton}>
          <Suspense clientOnly fallback={<BookmarkImportButtonSkeleton />}>
            <BookmarkImportButton />
          </Suspense>
        </ErrorBoundary>
        <BookmarkTooltip />
        <RefreshButton className="w-9 p-2 rounded-full transition hover:bg-zinc-800 active:bg-zinc-900" />
      </div>
      {children}
    </main>
  )
}
