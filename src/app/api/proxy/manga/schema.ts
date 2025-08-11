import { z } from 'zod/v4'

export enum ProxyIdOnly {
  THUMBNAIL = 'thumbnail',
}

export const GETProxyIdSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(10),
  only: z.enum(ProxyIdOnly).nullable(),
})

export type GETProxyIdRequest = z.infer<typeof GETProxyIdSchema>
