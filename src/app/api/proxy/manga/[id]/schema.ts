import { z } from 'zod/v4'

import { MAX_MANGA_ID } from '@/constants/policy'

export enum MangaResponseScope {
  IMAGE = '1',
  EXCLUDE_METADATA = '2',
}

export const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
  scope: z.enum(MangaResponseScope).nullable(),
})
