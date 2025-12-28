import 'server-only'
import { z } from 'zod'

export enum HarpiComicKind {
  EMPTY = 'EMPTY',
  ANIMATION = 'ANIMATION',
  MANGA = 'MANGA',
  COMIC = 'COMIC',
  NOVEL = 'NOVEL',
}

export enum HarpiListMode {
  RANDOM = 'random',
  SORT = 'sort',
}

export enum HarpiRandomMode {
  ALL = 'all',
  SEARCH = 'search',
}

export enum HarpiSort {
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  RATING_ASC = 'rating_asc',
  RATING_DESC = 'rating_desc',
  VIEWS_ASC = 'views_asc',
  VIEWS_DESC = 'views_desc',
}

export const HarpiSearchSchema = z
  .object({
    // Required
    comicKind: z.enum(HarpiComicKind).optional().default(HarpiComicKind.EMPTY),
    isIncludeTagsAnd: z.coerce.boolean().optional().default(true),
    minImageCount: z.coerce.number().int().min(0).max(2000).optional().default(0),
    maxImageCount: z.coerce.number().int().min(0).max(2000).optional().default(0),
    listMode: z.enum(HarpiListMode).optional().default(HarpiListMode.SORT),
    randomMode: z.enum(HarpiRandomMode).optional().default(HarpiRandomMode.SEARCH),
    page: z.coerce.number().int().min(0).optional().default(0),
    pageLimit: z.coerce.number().int().positive().max(1000).optional().default(10),
    sort: z.enum(HarpiSort).optional().default(HarpiSort.DATE_DESC),
    // Optional
    searchText: z.string().trim().max(200).optional(),
    lineText: z.string().optional(),
    authors: z.union([z.string(), z.array(z.string())]).optional(),
    groups: z.union([z.string(), z.array(z.string())]).optional(),
    series: z.union([z.string(), z.array(z.string())]).optional(),
    characters: z.union([z.string(), z.array(z.string())]).optional(),
    tags: z.union([z.string(), z.array(z.string())]).optional(),
    tagsExclude: z.union([z.string(), z.array(z.string())]).optional(),
    ids: z.union([z.coerce.number().int().positive(), z.array(z.coerce.number().int().positive())]).optional(),
  })
  .refine(
    (data) => {
      if (data.minImageCount && data.maxImageCount && data.minImageCount > data.maxImageCount) {
        return false
      }
      return true
    },
    { message: 'minImageCount <= maxImageCount 여야 합니다.' },
  )

export type GETHarpiSearchRequest = z.infer<typeof HarpiSearchSchema>
