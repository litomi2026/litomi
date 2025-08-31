import { and, eq, or } from 'drizzle-orm'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache, Suspense } from 'react'
import { z } from 'zod/v4'

import { defaultOpenGraph, SHORT_NAME } from '@/constants'
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

// NOTE: 연산이 무거우면 정적 메타데이터로 바꾸기
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const userId = await getUserIdFromCookie()
  const library = await getLibrary(libraryId, Number(userId))

  if (!library) {
    notFound()
  }

  return {
    title: `${library.name} - ${SHORT_NAME}`,
    openGraph: {
      ...defaultOpenGraph,
      title: `${library.name} - ${SHORT_NAME}`,
      url: `/library/${libraryId}`,
    },
    alternates: {
      canonical: `/library/${libraryId}`,
      languages: { ko: `/library/${libraryId}` },
    },
  }
}

export default async function LibraryDetailPage({ params }: PageProps<Params>) {
  const validation = schema.safeParse(await params)

  if (!validation.success) {
    notFound()
  }

  const { id: libraryId } = validation.data
  const userId = await getUserIdFromCookie()
  const library = await getLibrary(libraryId, Number(userId))

  if (!library) {
    notFound()
  }

  const isOwner = library.userId === Number(userId)

  return (
    <main className="flex flex-col">
      <Suspense>
        <LibraryItems isOwner={isOwner} library={library} />
      </Suspense>
    </main>
  )
}

const getLibrary = cache(async (libraryId: number, userId: number) => {
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
    .where(and(eq(libraryTable.id, libraryId), or(eq(libraryTable.userId, userId), eq(libraryTable.isPublic, true))))

  return library
})
