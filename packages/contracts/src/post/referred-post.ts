import { z } from 'zod'

export const deletedReferredPostSchema = z.object({
  isDeleted: z.literal(true),
})

export type DeletedReferredPost = z.infer<typeof deletedReferredPostSchema>

export const liveReferredPostSchema = z.object({
  isDeleted: z.literal(false).optional(),
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  content: z.string().nullable().optional(),
  imageURLs: z.array(z.string()).nullable().optional(),
  author: z
    .object({
      id: z.number(),
      nickname: z.string(),
      name: z.string(),
      imageURL: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
})

export type LiveReferredPost = z.infer<typeof liveReferredPostSchema>

export const referredPostSchema = z.union([deletedReferredPostSchema, liveReferredPostSchema])

export type ReferredPost = z.infer<typeof referredPostSchema>
