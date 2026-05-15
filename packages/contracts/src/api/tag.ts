import { z } from 'zod'

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
