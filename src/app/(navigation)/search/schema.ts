import { z } from 'zod/v4'

export const MangaSearchSchema = z
  .object({
    query: z.string().trim().max(200).optional(),
    view: z.enum(['img', 'card']).default('card'),
    sort: z.enum(['random', 'id_asc', 'popular']).optional(),
    'min-view': z.coerce.number().int().min(0).optional(),
    'max-view': z.coerce.number().int().min(0).optional(),
    'min-page': z.coerce.number().int().positive().max(10000).optional(),
    'max-page': z.coerce.number().int().positive().max(10000).optional(),
    from: z.coerce.number().int().min(0).optional(),
    to: z.coerce.number().int().min(0).optional(),
    'next-id': z.coerce.number().int().positive().optional(),
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
      if (data.from && data.to && data.from > data.to) {
        return false
      }
      return true
    },
    { error: '최소값은 최대값보다 클 수 없습니다.' },
  )

export type MangaSearch = z.infer<typeof MangaSearchSchema>
