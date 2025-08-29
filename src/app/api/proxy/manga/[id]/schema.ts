import { z } from 'zod/v4'

import { MAX_MANGA_ID } from '@/constants/policy'

export const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
})

export type GETProxyMangaIdRequest = z.infer<typeof GETProxyMangaIdSchema>
