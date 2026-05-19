import { TAGS_PER_PAGE } from '@litomi/domain/constants/policy'
import { Locale } from '@litomi/domain/locale'
import { z } from 'zod'

export const TagCategoryParam = ['female', 'male', 'mixed', 'other'] as const

export type TagCategoryParam = (typeof TagCategoryParam)[number]

export const getV1TagQuerySchema = z.object({
  category: z.enum(TagCategoryParam),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(TAGS_PER_PAGE).default(TAGS_PER_PAGE),
  locale: z.enum(Locale).default(Locale.KO),
})

export type GETV1TagQuery = z.infer<typeof getV1TagQuerySchema>

export const tagItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number(),
})

export type TagItem = z.infer<typeof tagItemSchema>

export const getV1TagResponseSchema = z.object({
  tags: z.array(tagItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export type GETV1TagResponse = z.infer<typeof getV1TagResponseSchema>
