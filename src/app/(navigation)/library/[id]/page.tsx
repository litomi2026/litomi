import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { libraryTable } from '@/database/schema'
import { PageProps } from '@/types/nextjs'
import { getUserIdFromCookie } from '@/utils/session'

import LibraryItems from './LibraryItems'
import ShareLibraryButton from './ShareLibraryButton'

const schema = z.object({
  id: z.coerce.number().int().positive(),
})

type Params = {
  id: string
}

export default async function LibraryDetailPage({ params }: PageProps<Params>) {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data

  const [library] = await db
    .select({
      id: libraryTable.id,
      name: libraryTable.name,
      description: libraryTable.description,
      icon: libraryTable.icon,
      color: libraryTable.color,
      isPublic: libraryTable.isPublic,
      userId: libraryTable.userId,
    })
    .from(libraryTable)
    .where(eq(libraryTable.id, libraryId))

  if (!library) {
    notFound()
  }

  const userId = await getUserIdFromCookie()
  const isOwner = library.userId === Number(userId)

  if (!library.isPublic && !isOwner) {
    notFound()
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-zinc-950 hidden sm:flex items-center justify-between gap-4 p-4 border-b border-zinc-800">
        <div
          className="size-10 rounded-lg flex items-center bg-zinc-800 justify-center text-xl shrink-0"
          style={{ backgroundColor: library.color ? `#${library.color.toString(16).padStart(6, '0')}` : '' }}
        >
          {library.icon?.slice(0, 2) ?? library.name.slice(0, 1)}
        </div>
        <div className="grid gap-1 flex-1">
          <h1 className="text-xl font-bold line-clamp-1">{library.name}</h1>
          {library.description && <p className="text-sm text-zinc-400 line-clamp-1">{library.description}</p>}
        </div>
        {library.isPublic && <ShareLibraryButton libraryId={library.id} libraryName={library.name} />}
      </div>
      <Suspense>
        <LibraryItems isOwner={isOwner} library={library} />
      </Suspense>
    </>
  )
}
