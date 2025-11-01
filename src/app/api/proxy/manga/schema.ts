import 'server-only'
import { z } from 'zod'

export enum ProxyIdOnly {
  THUMBNAIL = 'thumbnail',
}

export const GETProxyIdSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(10),
})

export type GETProxyIdRequest = z.infer<typeof GETProxyIdSchema>
