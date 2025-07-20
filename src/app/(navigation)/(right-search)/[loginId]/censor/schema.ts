import { z } from 'zod/v4'

import { CensorshipKey, CensorshipLevel } from '@/database/enum'

export const addFilterSchema = z.object({
  censorships: z.array(
    z.object({
      key: z.enum(CensorshipKey),
      values: z.array(z.string().min(1).max(256)),
      levels: z.array(z.enum(CensorshipLevel)),
    }),
  ),
  userId: z.coerce.number().int().positive(),
})

export const updateFilterSchema = z.object({
  id: z.coerce.number().int().positive(),
  level: z.enum(CensorshipLevel),
  userId: z.coerce.number().int().positive(),
})

export const deleteFilterSchema = z.object({
  id: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
})
