import { and, eq, or } from 'drizzle-orm'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache, Suspense } from 'react'
import { z } from 'zod/v4'

import { generateOpenGraphMetadata } from '@/constants'
import { db } from '@/database/supabase/drizzle'
import { libraryTable } from '@/database/supabase/schema'
import { getUserIdFromCookie } from '@/utils/cookie'

import LibraryItems from './LibraryItems'

const schema = z.object({
  id: z.coerce.number().int().positive(),
})

// NOTE: 연산이 무거우면 정적 메타데이터로 바꾸기
export async function generateMetadata({ params }: PageProps<'/library/[id]'>): Promise<Metadata> {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const userId = await getUserIdFromCookie()
  const library = await getLibrary(libraryId, userId)

  if (!library) {
    notFound()
  }

  return {
    title: library.name,
    ...generateOpenGraphMetadata({
      title: library.name,
      url: `/library/${libraryId}`,
    }),
    alternates: {
      canonical: `/library/${libraryId}`,
      languages: { ko: `/library/${libraryId}` },
    },
  }
}

export default async function LibraryDetailPage({ params }: PageProps<'/library/[id]'>) {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const userId = await getUserIdFromCookie()
  const library = await getLibrary(libraryId, userId)

  if (!library) {
    notFound()
  }

  const isOwner = library.userId === userId

  return (
    <main className="flex-1 flex flex-col">
      <Suspense>
        <LibraryItems isOwner={isOwner} library={library} />
      </Suspense>
    </main>
  )
}

const getLibrary = cache(async (libraryId: number, userId: number | null) => {
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
      and(eq(libraryTable.id, libraryId), or(eq(libraryTable.userId, userId ?? 0), eq(libraryTable.isPublic, true))),
    )

  return library
})
