import { z } from 'zod/v4'

import { BlurLevel, FilterType } from '@/database/enum'

export const addFilterSchema = z.object({
  filterType: z.enum(FilterType),
  filterValue: z.string().min(1).max(256),
  blurLevel: z.enum(BlurLevel),
})

export const updateFilterSchema = z.object({
  id: z.coerce.number().int().positive(),
  blurLevel: z.enum(BlurLevel),
})

export const deleteFilterSchema = z.object({
  id: z.coerce.number().int().positive(),
})
