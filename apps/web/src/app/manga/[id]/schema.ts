import 'server-only'
import { z } from 'zod'

import { MAX_MANGA_ID } from '@/constants/policy'

export const mangaSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})
