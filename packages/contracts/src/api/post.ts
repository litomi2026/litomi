import { Locale } from '@litomi/domain/locale'
import { PostFilter } from '@litomi/domain/post/filter'
import type { PostType } from '@litomi/domain/post/model'
import { MAX_POST_CONTENT_LENGTH, POST_PER_PAGE } from '@litomi/domain/post/policy'
import { z } from 'zod'

import type { CatalogManga } from '../catalog/manga'
import type { ReferredPost } from '../post/referred-post'

export interface Post {
  id: number
  createdAt: Date
  content: string | null
  type: PostType
  author: {
    id: number
    name: string
    nickname: string
    imageURL: string | null
  } | null
  mangaId: number | null
  manga?: CatalogManga
  parentPostId: number | null
  likeCount: number
  commentCount: number
  repostCount: number
  viewCount?: number
  referredPost: ReferredPost | null
  imageURLs?: string[] | null
  bookmarkCount?: number
}

export interface GETV1PostResponse {
  posts: Post[]
  nextCursor: string | null
}

export const postFilterSchema = z.enum(PostFilter)

const getV1PostQueryBaseSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(POST_PER_PAGE).default(POST_PER_PAGE),
  locale: z.enum(Locale).default(Locale.KO),
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

export const postV1PostBodySchema = z.object({
  content: z.string().min(2).max(MAX_POST_CONTENT_LENGTH),
  mangaId: z.coerce.number().int().positive().nullable().optional(),
  parentPostId: z.coerce.number().int().positive().nullable().optional(),
  referredPostId: z.coerce.number().int().positive().nullable().optional(),
})

export type POSTV1PostBody = z.infer<typeof postV1PostBodySchema>

export interface POSTV1PostResponse {
  id: number
}

export type DELETEV1PostIdLikeResponse = undefined

export type DELETEV1PostIdResponse = undefined

export interface PUTV1PostIdLikeResponse {
  liked: true
}

export interface GETV1PostLikedResponse {
  postIds: number[]
}
