import 'server-only'
import { MAX_MANGA_ID } from '@litomi/domain/manga/policy'
import { z } from 'zod'

export const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})
