import 'server-only'
import z from 'zod'

export const conditionSchema = z.object({
  type: z.number().int().min(1).max(6),
  value: z
    .string()
    .min(1)
    .max(100)
    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, '_')),
})

export const createCriteriaSchema = z.object({
  name: z.string().min(1).max(32),
  conditions: z.array(conditionSchema).min(1).max(10),
  isActive: z.boolean().default(true),
})

export const updateCriteriaSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1).max(32).optional(),
  conditions: z.array(conditionSchema).min(1).max(10).optional(),
  isActive: z.boolean().optional(),
})

export const deleteCriteriaSchema = z.object({
  id: z.coerce.number(),
})
