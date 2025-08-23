import { and, eq, or } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod/v4'

import { db } from '@/database/drizzle'
import { libraryTable } from '@/database/schema'
import { PageProps } from '@/types/nextjs'
import { getUserIdFromCookie } from '@/utils/session'

import LibraryItems from './LibraryItems'

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
  const userId = await getUserIdFromCookie()

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
    .where(
      and(eq(libraryTable.id, libraryId), or(eq(libraryTable.userId, Number(userId)), eq(libraryTable.isPublic, true))),
    )

  if (!library) {
    notFound()
  }

  const isOwner = library.userId === Number(userId)

  return (
    <main className="flex flex-col flex-1">
      <Suspense>
        <LibraryItems isOwner={isOwner} library={library} />
      </Suspense>
    </main>
  )
}
