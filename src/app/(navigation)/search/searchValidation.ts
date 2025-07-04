import { z } from 'zod'

export const SearchParamsSchema = z
  .object({
    categories: z
      .string()
      .regex(/^[\d,]+$/)
      .optional(),
    search: z.string().trim().max(200).optional(),
    sort: z.enum(['random', 'id_asc', 'popular']).optional(),
    'min-views': z.coerce.number().int().min(0).optional(),
    'max-views': z.coerce.number().int().min(0).optional(),
    'min-pages': z.coerce.number().int().min(1).max(10000).optional(),
    'max-pages': z.coerce.number().int().min(1).max(10000).optional(),
    'start-date': z.coerce.number().int().min(0).optional(),
    'end-date': z.coerce.number().int().min(0).optional(),
    'next-id': z.string().regex(/^\d+$/).optional(),
    offset: z.coerce.number().int().min(0).max(10000).optional(),
  })
  .refine(
    (data) => {
      if (data['min-views'] && data['max-views'] && data['min-views'] > data['max-views']) {
        return false
      }
      if (data['min-pages'] && data['max-pages'] && data['min-pages'] > data['max-pages']) {
        return false
      }
      if (data['start-date'] && data['end-date'] && data['start-date'] > data['end-date']) {
        return false
      }
      return true
    },
    { message: '최소값은 최대값보다 클 수 없습니다.' },
  )

export type ValidatedSearchParams = z.infer<typeof SearchParamsSchema>

export const MangaSearchSchema = z
  .object({
    query: z.string().trim().max(200).optional(),
    view: z.enum(['img', 'card']).default('card'),
    sort: z.enum(['random', 'id_asc', 'popular']).optional(),
    'min-view': z.coerce.number().int().min(0).optional(),
    'max-view': z.coerce.number().int().min(0).optional(),
    'min-page': z.coerce.number().int().min(1).max(10000).optional(),
    'max-page': z.coerce.number().int().min(1).max(10000).optional(),
    from: z.coerce.number().int().min(0).optional(),
    until: z.coerce.number().int().min(0).optional(),
    'next-id': z.string().regex(/^\d+$/).optional(),
    skip: z.coerce.number().int().min(0).max(10000).optional(),
  })
  .refine(
    (data) => {
      if (data['min-view'] && data['max-view'] && data['min-view'] > data['max-view']) {
        return false
      }
      if (data['min-page'] && data['max-page'] && data['min-page'] > data['max-page']) {
        return false
      }
      if (data.from && data.until && data.from > data.until) {
        return false
      }
      return true
    },
    { message: '최소값은 최대값보다 클 수 없습니다.' },
  )

export type MangaSearch = z.infer<typeof MangaSearchSchema>
