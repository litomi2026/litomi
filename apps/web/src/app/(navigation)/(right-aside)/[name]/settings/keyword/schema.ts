import 'server-only'
import { notificationCriteriaConditionsSchema } from '@litomi/contracts'
import z from 'zod'

export const updateCriteriaSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1).max(32).optional(),
  conditions: notificationCriteriaConditionsSchema.optional(),
  isActive: z.boolean().optional(),
})

export const deleteCriteriaSchema = z.object({
  id: z.coerce.number(),
})
