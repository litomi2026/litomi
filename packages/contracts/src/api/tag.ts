import { Locale } from '@litomi/domain/locale'
import { TAGS_PER_PAGE } from '@litomi/domain/tag/policy'
import { z } from 'zod'

export const TagCategoryParam = ['female', 'male', 'mixed', 'other'] as const

export type TagCategoryParam = (typeof TagCategoryParam)[number]

export const getV1TagQuerySchema = z.object({
  category: z.enum(TagCategoryParam),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(TAGS_PER_PAGE).default(TAGS_PER_PAGE),
  locale: z.enum(Locale),
})

export interface TagItem {
  value: string
  label: string
  count: number
}

export interface GETV1TagResponse {
  tags: TagItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
