import 'server-only'
import { MAX_MANGA_ID } from '@litomi/domain/constants/policy'
import { Locale } from '@litomi/domain/locale'
import { z } from 'zod'

export const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
  locale: z.enum(Locale),
})
