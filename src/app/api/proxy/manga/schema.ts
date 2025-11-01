import 'server-only'
import { z } from 'zod'

import { Locale } from '@/translation/common'

export enum ProxyIdOnly {
  THUMBNAIL = 'thumbnail',
}

export const GETProxyIdSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(10),
  locale: z.enum(Locale),
})

export type GETProxyIdRequest = z.infer<typeof GETProxyIdSchema>
