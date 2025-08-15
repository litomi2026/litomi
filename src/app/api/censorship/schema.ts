import { z } from 'zod/v4'

import { MAX_CENSORSHIPS_PER_USER } from '@/constants/policy'

export const GETCensorshipsSchema = z.object({
  cursorId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(MAX_CENSORSHIPS_PER_USER).default(20),
})

export type GETCensorshipsRequest = z.infer<typeof GETCensorshipsSchema>
