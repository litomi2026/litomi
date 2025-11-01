import 'server-only'
import { z } from 'zod'

import { CensorshipKey, CensorshipLevel } from '@/database/enum'

export const addCensorshipsSchema = z
  .object({
    keys: z.array(z.enum(CensorshipKey)).min(1).max(100),
    values: z.array(z.string().min(1).max(256)).min(1).max(100),
    levels: z.array(z.enum(CensorshipLevel)).min(1).max(100),
  })
  .refine((data) => data.keys.length === data.values.length && data.values.length === data.levels.length, {
    message: 'Arrays must have the same length',
    path: ['keys'],
  })

export const deleteCensorshipsSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(100),
})

export const updateCensorshipsSchema = z
  .object({
    ids: z.array(z.coerce.number().int().positive()).min(1).max(100),
    keys: z.array(z.enum(CensorshipKey)).min(1).max(100),
    values: z.array(z.string().min(1).max(256)).min(1).max(100),
    levels: z.array(z.enum(CensorshipLevel)).min(1).max(100),
  })
  .refine(
    (data) =>
      data.ids.length === data.keys.length &&
      data.keys.length === data.values.length &&
      data.values.length === data.levels.length,
    {
      message: 'Arrays must have the same length',
      path: ['ids'],
    },
  )
