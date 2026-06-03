import { PostFilter } from '@litomi/domain/post/filter'
import { PostType } from '@litomi/domain/post/model'
import { MAX_POST_CONTENT_LENGTH, POST_PER_PAGE } from '@litomi/domain/post/policy'
import { z } from 'zod'

import { referredPostSchema } from '../post/referred-post'

export const postIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type PostIdParam = z.infer<typeof postIdParamSchema>

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
  referredPost: referredPostSchema.nullable(),
  imageURLs: z.array(z.string()).nullable().optional(),
  bookmarkCount: z.number().optional(),
})

export type Post = z.infer<typeof postSchema>

export const getV1PostResponseSchema = z.object({
  posts: z.array(postSchema),
  nextCursor: z.string().nullable(),
})

export type GETV1PostResponse = z.infer<typeof getV1PostResponseSchema>

export const postFilterSchema = z.enum(PostFilter)

const getV1PostQueryBaseSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(POST_PER_PAGE).default(POST_PER_PAGE),
  mangaId: z.coerce.number().int().positive().optional(),
})

const getV1UserPostQuerySchema = getV1PostQueryBaseSchema.extend({
  filter: z.enum([PostFilter.USER, PostFilter.USER_REPLY]),
  username: z.string().min(1).max(32),
})

const getV1TimelinePostQuerySchema = getV1PostQueryBaseSchema.extend({
  filter: z.enum([PostFilter.FOLLOWING, PostFilter.MANGA, PostFilter.RECOMMEND]).optional(),
  username: z.never().optional(),
})

export const getV1PostQuerySchema = z.union([getV1UserPostQuerySchema, getV1TimelinePostQuerySchema])

export type GETV1PostQuery = z.infer<typeof getV1PostQuerySchema>

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
