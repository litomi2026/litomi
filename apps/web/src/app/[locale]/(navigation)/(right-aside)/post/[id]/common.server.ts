import { db } from '@litomi/db/app'
import { postTable } from '@litomi/db/app/post'
import type { PublicLocale } from '@litomi/domain/locale'
import 'server-only'
import selectPost from '@litomi/db/app/query/post'
import selectPostComment from '@litomi/db/app/query/post-comment'
import { sql } from 'drizzle-orm'
import { cache } from 'react'
import { z } from 'zod'

import { getCatalogMangaMap } from '@/utils/catalog-manga.server'

export const postParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const POST_DETAIL_COMMENTS_PREVIEW_LIMIT = 20
export const POST_DETAIL_PARENT_CHAIN_LIMIT = 5

export const getPost = cache(async (id: number, locale: PublicLocale) => {
  const [post] = await withCatalogMangas(await selectPost({ postId: id }), locale)
  return post ?? null
})

export async function getPostComment(postId: number) {
  return selectPostComment({ parentPostId: postId, limit: POST_DETAIL_COMMENTS_PREVIEW_LIMIT })
}

export async function getPostConversation(id: number, locale: PublicLocale) {
  const post = await getPost(id, locale)

  if (!post) {
    return null
  }

  if (!post.parentPostId) {
    return { parentPosts: [], post }
  }

  const parentPostIds = await selectPostAncestorIds(id)
  const parentPostRows = await withCatalogMangas(await selectPost({ postIds: parentPostIds }), locale)
  const parentPostById = new Map(parentPostRows.map((parentPost) => [parentPost.id, parentPost]))

  return {
    parentPosts: parentPostIds.flatMap((parentPostId) => parentPostById.get(parentPostId) ?? []),
    post,
  }
}

async function selectPostAncestorIds(postId: number) {
  const rows = await db.execute<{ depth: number; id: number | string }>(sql`
    WITH RECURSIVE ancestor_posts AS (
      SELECT
        ${postTable.id} AS id,
        ${postTable.parentPostId} AS parent_post_id,
        0 AS depth,
        ARRAY[${postTable.id}]::bigint[] AS path
      FROM ${postTable}
      WHERE ${postTable.id} = ${postId}

      UNION ALL

      SELECT
        parent_posts.id,
        parent_posts.parent_post_id,
        ancestor_posts.depth + 1,
        ancestor_posts.path || parent_posts.id
      FROM ancestor_posts
      INNER JOIN ${postTable} parent_posts ON parent_posts.id = ancestor_posts.parent_post_id
      WHERE ancestor_posts.parent_post_id IS NOT NULL
        AND ancestor_posts.depth < ${POST_DETAIL_PARENT_CHAIN_LIMIT}
        AND ancestor_posts.parent_post_id <> ALL(ancestor_posts.path)
    )
    SELECT id, depth
    FROM ancestor_posts
    WHERE depth > 0
    ORDER BY depth DESC
  `)

  return rows.map((row) => Number(row.id))
}

async function withCatalogMangas<T extends { mangaId: number | null }>(posts: T[], locale: PublicLocale) {
  const mangaIds: number[] = []

  for (const post of posts) {
    if (post.mangaId) {
      mangaIds.push(post.mangaId)
    }
  }

  const catalogMangaMap = mangaIds.length > 0 ? await getCatalogMangaMap(mangaIds, locale) : new Map()

  return posts.map((post) => ({
    ...post,
    manga: post.mangaId ? catalogMangaMap.get(post.mangaId) : undefined,
  }))
}
