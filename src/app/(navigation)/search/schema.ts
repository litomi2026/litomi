import { z } from 'zod/v4'

export const subscribeToKeywordSchema = z.object({
  conditions: z
    .array(z.object({ type: z.number().int().positive(), value: z.string() }))
    .min(1)
    .max(20),
  criteriaName: z.string().min(1).max(32),
})
