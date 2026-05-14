import { MAX_POST_CONTENT_LENGTH } from '@litomi/domain/constants/policy'
import { PostType } from '@litomi/domain/database/enum'
import { z } from 'zod'

import type { ReferredPost } from '../post/referred-post'

export const postSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
  content: z.string().nullable(),
  type: z.enum(PostType),
  author: z
    .object({
      id: z.number(),
      name: z.string(),
      nickname: z.string(),
      imageURL: z.string().nullable(),
    })
    .nullable(),
  mangaId: z.number().nullable(),
  parentPostId: z.number().nullable(),
  likeCount: z.number(),
  commentCount: z.number(),
  repostCount: z.number(),
  viewCount: z.number().optional(),
  referredPost: z.custom<ReferredPost>().nullable(),
  imageURLs: z.array(z.string()).nullable().optional(),
  bookmarkCount: z.number().optional(),
})

export type Post = z.infer<typeof postSchema>

export const getV1PostResponseSchema = z.object({
  posts: z.array(postSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1PostResponse = z.infer<typeof getV1PostResponseSchema>

export const postV1PostBodySchema = z.object({
  content: z.string().min(2).max(MAX_POST_CONTENT_LENGTH),
  mangaId: z.coerce.number().int().positive().nullable().optional(),
  parentPostId: z.coerce.number().int().positive().nullable().optional(),
  referredPostId: z.coerce.number().int().positive().nullable().optional(),
})

export type POSTV1PostBody = z.infer<typeof postV1PostBodySchema>

export const postV1PostResponseSchema = z.object({
  id: z.number(),
})

export type DELETEV1PostIdLikeResponse = void

export type DELETEV1PostIdResponse = void

export type POSTV1PostResponse = z.infer<typeof postV1PostResponseSchema>

export const putV1PostIdLikeResponseSchema = z.object({
  liked: z.literal(true),
})

export type PUTV1PostIdLikeResponse = z.infer<typeof putV1PostIdLikeResponseSchema>

export const getV1PostLikedResponseSchema = z.object({
  postIds: z.array(z.number()),
})

export type GETV1PostLikedResponse = z.infer<typeof getV1PostLikedResponseSchema>
