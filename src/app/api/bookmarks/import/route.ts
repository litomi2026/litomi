import { sql } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { z } from 'zod/v4'

import { handleRouteError } from '@/crawler/proxy-utils'
import { db } from '@/database/drizzle'
import { BookmarkSource } from '@/database/enum'
import { bookmarkTable } from '@/database/schema'
import { getUserIdFromAccessToken } from '@/utils/cookie'

const importedBookmarkSchema = z.object({
  mangaId: z.number().int().positive(),
  source: z.enum(BookmarkSource),
  createdAt: z.iso.datetime({ offset: true }).optional(),
})

const bookmarkImportSchema = z.object({
  exportedAt: z.iso.datetime({ offset: true }).optional(),
  totalCount: z.number().int().nonnegative().optional(),
  bookmarks: z.array(importedBookmarkSchema),
})

export type ImportMode = 'merge' | 'replace'

export type ImportResult = {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}

const MAX_FILE_SIZE = 1024 * 1024 // 1MB
const BATCH_SIZE = 100

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const userId = await getUserIdFromAccessToken(cookieStore)

  if (!userId) {
    return new Response('401 Unauthorized', { status: 401 })
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return new Response('400 Bad Request', { status: 400 })
  }

  const contentLength = request.headers.get('content-length')

  if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
    return new Response('400 Bad Request', { status: 400 })
  }

  try {
    const body = await request.json()
    const url = new URL(request.url)
    const mode = (url.searchParams.get('mode') || 'merge') as ImportMode
    const validation = bookmarkImportSchema.safeParse(body)

    if (!validation.success) {
      return new Response('400 Bad Request', { status: 400 })
    }

    const { bookmarks } = validation.data
    const errors: string[] = []
    let imported = 0
    let skipped = 0

    // TODO: AI 코드 분석하기
    await db.transaction(async (tx) => {
      // If replace mode, delete all existing bookmarks first
      if (mode === 'replace') {
        await tx.delete(bookmarkTable).where(sql`${bookmarkTable.userId} = ${userId}`)
      }

      // Process bookmarks in batches
      for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
        const batch = bookmarks.slice(i, i + BATCH_SIZE)

        for (const bookmark of batch) {
          try {
            // Check if bookmark already exists (for merge mode)
            if (mode === 'merge') {
              const [existing] = await tx
                .select({ mangaId: bookmarkTable.mangaId })
                .from(bookmarkTable)
                .where(sql`${bookmarkTable.userId} = ${userId} AND ${bookmarkTable.mangaId} = ${bookmark.mangaId}`)
                .limit(1)

              if (existing) {
                skipped++
                continue
              }
            }

            // Insert the bookmark
            await tx.insert(bookmarkTable).values({
              userId: Number(userId),
              mangaId: bookmark.mangaId,
              source: bookmark.source,
              createdAt: bookmark.createdAt ? new Date(bookmark.createdAt) : new Date(),
            })

            imported++
          } catch (error) {
            console.error(`Failed to import bookmark ${bookmark.mangaId}:`, error)
            errors.push(`만화 ID ${bookmark.mangaId} 가져오기 실패`)
            skipped++
          }
        }
      }
    })

    return Response.json({
      success: true,
      imported,
      skipped,
      errors,
    } satisfies ImportResult)
  } catch (error) {
    return handleRouteError(error, request)
  }
}
