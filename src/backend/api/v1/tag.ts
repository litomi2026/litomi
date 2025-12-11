import { zValidator } from '@hono/zod-validator'
import { count, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { Env } from '@/backend'
import { createCacheControl } from '@/crawler/proxy-utils'
import { aivenDB } from '@/database/aiven/drizzle'
import { mangaTagTable, tagTable } from '@/database/aiven/schema'
import { Locale } from '@/translation/common'
import { translateTag } from '@/translation/tag'
import { sec } from '@/utils/date'

const TAGS_PER_PAGE = 100

const CategoryParam = ['female', 'male', 'mixed', 'other'] as const
type CategoryParam = (typeof CategoryParam)[number]

const categoryToNumber: Record<CategoryParam, number> = {
  female: 0,
  male: 1,
  mixed: 2,
  other: 3,
}

const querySchema = z.object({
  category: z.enum(CategoryParam),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(TAGS_PER_PAGE).default(TAGS_PER_PAGE),
  locale: z.enum(Locale).default(Locale.KO),
})

export type GETV1TagResponse = {
  tags: TagItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type TagItem = {
  value: string
  label: string
  count: number
}

const tagRoutes = new Hono<Env>()

tagRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const { category, page, limit, locale } = c.req.valid('query')
  const categoryNumber = categoryToNumber[category]
  const offset = (page - 1) * limit

  const [tagsWithCount, totalCountRow] = await Promise.all([
    aivenDB
      .select({
        value: tagTable.value,
        count: count(mangaTagTable.mangaId),
      })
      .from(tagTable)
      .leftJoin(mangaTagTable, eq(tagTable.id, mangaTagTable.tagId))
      .where(eq(tagTable.category, categoryNumber))
      .groupBy(tagTable.id)
      .orderBy(({ count }) => [desc(count), tagTable.value])
      .limit(limit)
      .offset(offset),
    aivenDB.select({ count: count() }).from(tagTable).where(eq(tagTable.category, categoryNumber)),
  ])

  const totalCount = totalCountRow[0]?.count ?? 0
  const totalPages = Math.ceil(totalCount / limit)

  const tags: TagItem[] = tagsWithCount.map(({ value, count }) => {
    const translated = translateTag(category, value, locale)
    return {
      value: `${category}:${value}`,
      label: translated.label,
      count,
    }
  })

  const cacheControl = createCacheControl({
    public: true,
    maxAge: 3,
    sMaxAge: sec('30 days'),
    swr: sec('1 day'),
  })

  const response: GETV1TagResponse = {
    tags,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
  }

  return c.json<GETV1TagResponse>(response, { headers: { 'Cache-Control': cacheControl } })
})

export default tagRoutes
