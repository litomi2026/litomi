import 'server-only'
import { z } from 'zod'

import { MAX_MANGA_ID } from '@/constants/policy'
import { Locale } from '@/translation/common'

import { MangaResponseScope } from './types'

export const GETProxyMangaIdSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_MANGA_ID),
  scope: z.enum(MangaResponseScope).nullable(),
  locale: z.enum(Locale),
})
