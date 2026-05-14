import 'server-only'
import { z } from 'zod'

import { MAX_SEARCH_QUERY_LENGTH } from '@/constants/policy'
import { Locale } from '@/translation/common'

import { Sort } from './types'

export const GETProxyKSearchSchema = z
  .object({
    query: z.string().trim().max(MAX_SEARCH_QUERY_LENGTH).optional(),
    sort: z.enum(Sort).optional(),
    'min-rating': z.coerce.number().int().min(0).max(500).optional(),
    'max-rating': z.coerce.number().int().min(0).max(500).optional(),
    'min-view': z.coerce.number().int().min(0).optional(),
    'max-view': z.coerce.number().int().min(0).optional(),
    'min-page': z.coerce.number().int().positive().max(10000).optional(),
    'max-page': z.coerce.number().int().positive().max(10000).optional(),
    from: z.coerce.number().int().min(0).optional(),
    to: z.coerce.number().int().min(0).optional(),
    'next-id': z.coerce.number().int().positive().optional(),
    'next-views': z.coerce.number().int().min(0).optional(),
    'next-views-id': z.coerce.number().int().positive().optional(),
    skip: z.coerce.number().int().min(0).max(10000).optional(),
    locale: z.enum(Locale).optional(),
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
      if (data['min-rating'] && data['max-rating'] && data['min-rating'] > data['max-rating']) {
        return false
      }
      return true
    },
    { error: '최소값은 최대값보다 클 수 없어요' },
  )
