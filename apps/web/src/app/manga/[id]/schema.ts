import 'server-only'
import { MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { z } from 'zod'

export const mangaSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})
